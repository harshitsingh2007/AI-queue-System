"""
main.py
--------
FastAPI + Socket.IO Backend for AI-Powered Smart Queue System.

Endpoints & Real-time Features:
- Multi-Tenant Isolation
- Complete Queue Lifecycle (Join, Serve, Complete, No-Show, Cancel)
- Dynamic Counter Adjustments
- Real-Time Analytics API
- On-Demand Incremental ML Retraining Endpoint
- Base64 QR Code Generator Endpoint for Mobile Check-in
"""

import io
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
import socketio
import qrcode

from queue_engine import engine, PRIORITY_EMERGENCY, PRIORITY_ROUTINE, PRIORITY_STANDARD
from train_model import retrain_model_from_logs

app = FastAPI(title="AI Queue Plugin API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class JoinRequest(BaseModel):
    tenant_id: str = Field(..., example="city-hospital-01")
    consumer_type: str = Field(..., example="hospital")
    service_category: str = Field(..., example="consultation")
    name: str = Field(..., example="Priya Sharma")
    urgency: Optional[str] = Field(None, description="'emergency' | 'routine'")

class ServeNextRequest(BaseModel):
    tenant_id: str
    service_category: Optional[str] = None

class TicketActionRequest(BaseModel):
    tenant_id: str
    ticket_id: str

class CounterUpdateRequest(BaseModel):
    tenant_id: str
    active_counters: int

def _urgency_to_priority(consumer_type: str, urgency: Optional[str]) -> int:
    if consumer_type != "hospital":
        return PRIORITY_STANDARD
    if urgency == "emergency":
        return PRIORITY_EMERGENCY
    return PRIORITY_ROUTINE

async def _broadcast_queue_update(tenant_id: str):
    snapshot = engine.get_queue_snapshot(tenant_id)
    serving = engine.get_serving_tickets(tenant_id)
    analytics = engine.get_tenant_analytics(tenant_id)

    await sio.emit("queue_update", {"snapshot": snapshot, "serving": serving}, room=tenant_id)
    await sio.emit("analytics_update", analytics, room=tenant_id)

    alerts = engine.get_tickets_needing_turn_alert(tenant_id)
    if alerts:
        await sio.emit("turn_alert", {"tickets": alerts}, room=tenant_id)

# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/plugin/join")
async def join_queue(payload: JoinRequest):
    priority = _urgency_to_priority(payload.consumer_type, payload.urgency)

    ticket = engine.join_queue(
        tenant_id=payload.tenant_id,
        consumer_type=payload.consumer_type,
        service_category=payload.service_category,
        name=payload.name,
        priority_level=priority,
    )
    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)

    return {"success": True, "ticket": ticket.to_dict()}

@app.post("/api/v1/plugin/serve-next")
async def serve_next(payload: ServeNextRequest):
    ticket = engine.serve_next(payload.tenant_id, payload.service_category)
    if not ticket:
        raise HTTPException(status_code=404, detail="No waiting tickets in queue.")

    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)
    await sio.emit("now_serving", {"ticket": ticket.to_dict()}, room=payload.tenant_id)

    return {"success": True, "now_serving": ticket.to_dict()}

@app.post("/api/v1/plugin/complete")
async def complete_ticket(payload: TicketActionRequest):
    ticket = engine.complete_ticket(payload.tenant_id, payload.ticket_id)
    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)
    return {"success": True, "completed_ticket": ticket.to_dict() if ticket else None}

@app.post("/api/v1/plugin/no-show")
async def mark_no_show(payload: TicketActionRequest):
    engine.mark_no_show(payload.tenant_id, payload.ticket_id)
    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)
    return {"success": True}

@app.post("/api/v1/plugin/cancel")
async def cancel_ticket(payload: TicketActionRequest):
    engine.cancel_ticket(payload.tenant_id, payload.ticket_id)
    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)
    return {"success": True}

@app.post("/api/v1/plugin/counters")
async def set_counters(payload: CounterUpdateRequest):
    new_count = engine.set_active_counters(payload.tenant_id, payload.active_counters)
    await _broadcast_queue_update(payload.tenant_id)
    return {"success": True, "active_counters": new_count}

@app.get("/api/v1/plugin/analytics/{tenant_id}")
async def get_analytics(tenant_id: str):
    return engine.get_tenant_analytics(tenant_id)

@app.get("/api/v1/plugin/queue/{tenant_id}")
async def get_queue(tenant_id: str):
    return {
        "snapshot": engine.get_queue_snapshot(tenant_id),
        "serving": engine.get_serving_tickets(tenant_id)
    }

@app.post("/api/v1/plugin/retrain")
async def trigger_retrain():
    """Triggers ML model retraining on accumulated operational service logs."""
    logs = engine.fetch_all_service_logs()
    bundle = retrain_model_from_logs(logs)
    engine.reload_model_bundle()

    return {
        "success": True,
        "model_name": bundle["model_name"],
        "best_mae": bundle["best_mae"],
        "trained_at": bundle["trained_at"],
        "records_count": len(logs),
    }

@app.get("/api/v1/plugin/qr/{tenant_id}")
async def generate_qr(tenant_id: str, host: Optional[str] = "http://localhost:5173"):
    """Generates Base64 encoded QR Code data URI for host site check-in."""
    target_url = f"{host}?tenant={tenant_id}"
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1e293b", back_color="#ffffff")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "tenant_id": tenant_id,
        "target_url": target_url,
        "qr_code_base64": f"data:image/png;base64,{img_str}"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

# ---------------------------------------------------------------------------
# Socket.IO Layer
# ---------------------------------------------------------------------------
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

@sio.event
async def connect(sid, environ, auth):
    tenant_id = (auth or {}).get("tenant_id", "default")
    await sio.enter_room(sid, tenant_id)

    snapshot = engine.get_queue_snapshot(tenant_id)
    serving = engine.get_serving_tickets(tenant_id)
    analytics = engine.get_tenant_analytics(tenant_id)

    await sio.emit("queue_update", {"snapshot": snapshot, "serving": serving}, to=sid)
    await sio.emit("analytics_update", analytics, to=sid)

@sio.event
async def join_queue(sid, data):
    tenant_id = data["tenant_id"]
    priority = _urgency_to_priority(data["consumer_type"], data.get("urgency"))

    ticket = engine.join_queue(
        tenant_id=tenant_id,
        consumer_type=data["consumer_type"],
        service_category=data["service_category"],
        name=data["name"],
        priority_level=priority,
    )
    engine.recalculate_wait_times(tenant_id)

    await sio.emit("ticket_created", {"ticket": ticket.to_dict()}, to=sid)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def serve_next(sid, data):
    tenant_id = data["tenant_id"]
    service_category = data.get("service_category")

    ticket = engine.serve_next(tenant_id, service_category)
    if not ticket:
        await sio.emit("error", {"message": "No waiting tickets in queue."}, to=sid)
        return

    engine.recalculate_wait_times(tenant_id)
    await sio.emit("now_serving", {"ticket": ticket.to_dict()}, room=tenant_id)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def complete_ticket(sid, data):
    tenant_id = data["tenant_id"]
    ticket_id = data["ticket_id"]
    engine.complete_ticket(tenant_id, ticket_id)
    engine.recalculate_wait_times(tenant_id)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def set_counters(sid, data):
    tenant_id = data["tenant_id"]
    count = data["active_counters"]
    engine.set_active_counters(tenant_id, count)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def trigger_retrain(sid, data):
    logs = engine.fetch_all_service_logs()
    bundle = retrain_model_from_logs(logs)
    engine.reload_model_bundle()
    await sio.emit("retrain_complete", {
        "model_name": bundle["model_name"],
        "best_mae": bundle["best_mae"],
        "trained_at": bundle["trained_at"]
    }, to=sid)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
