"""
main.py
--------
FastAPI + Socket.IO Backend for AI-Powered Smart Queue System.

Endpoints & Real-time Features:
- Multi-Tenant Isolation
- Complete Queue Lifecycle (Join, Serve, Complete, No-Show, Cancel)
- Dynamic Counter Adjustments
- Real-Time Analytics API
- Base64 QR Code Generator Endpoint
- Historical Data Preview, Ingestion, Validation & Auto Column Mapping APIs:
  - `POST /api/v1/plugin/historical-data/preview`
  - `POST /api/v1/plugin/historical-data/upload`
  - `POST /api/v1/plugin/historical-data/train`
  - `GET /api/v1/plugin/model-status/{tenant_id}`
"""

import io
import json
import base64
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import socketio
import qrcode

from queue_engine import engine, PRIORITY_EMERGENCY, PRIORITY_ROUTINE, PRIORITY_STANDARD
from schema_validator import detect_column_mappings, validate_and_transform_dataframe
from train_model import train_model_for_tenant, get_tenant_model_info, MIN_TRAINING_ROWS

app = FastAPI(title="AI Queue Plugin API", version="2.5.0")

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
    tenant_id: str = Field(..., json_schema_extra={"example": "city-hospital-01"})
    consumer_type: str = Field(..., json_schema_extra={"example": "hospital"})
    service_category: str = Field(..., json_schema_extra={"example": "consultation"})
    name: str = Field(..., json_schema_extra={"example": "Priya Sharma"})
    urgency: Optional[str] = Field(None, description="'emergency' | 'routine'")
    user_email: Optional[str] = None

class ServeNextRequest(BaseModel):
    tenant_id: str
    service_category: Optional[str] = None

class TicketActionRequest(BaseModel):
    tenant_id: str
    ticket_id: str

class CounterUpdateRequest(BaseModel):
    tenant_id: str
    active_counters: int

class TrainTenantRequest(BaseModel):
    tenant_id: str = "global"

class SignupRequest(BaseModel):
    email: str
    username: str
    password: str
    role: Optional[str] = "user"
    department: Optional[str] = "all"

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    email: str
    username: str
    phone: Optional[str] = ""
    gender: Optional[str] = ""
    age: Optional[int] = 0
    medical_id: Optional[str] = ""
    department: Optional[str] = "all"

class BookAppointmentRequest(BaseModel):
    tenant_id: str
    consumer_type: Optional[str] = "hospital"
    service_category: str
    patient_name: str
    user_email: Optional[str] = ""
    appointment_date: str
    time_slot: str

class CheckInAppointmentRequest(BaseModel):
    appointment_id: str

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
# Core Queue & Counter Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/plugin/join")
async def join_queue_http_endpoint(req: JoinRequest):
    priority = _urgency_to_priority(req.consumer_type, req.urgency)

    ticket = engine.join_queue(
        tenant_id=req.tenant_id,
        consumer_type=req.consumer_type,
        service_category=req.service_category,
        name=req.name,
        priority_level=priority,
        user_email=req.user_email or "",
    )
    engine.recalculate_wait_times(req.tenant_id)
    await _broadcast_queue_update(req.tenant_id)

    return {"status": "success", "ticket": ticket.to_dict()}

@app.post("/api/v1/plugin/queue/join")
async def join_queue_alt_endpoint(req: JoinRequest):
    return await join_queue_http_endpoint(req)

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
async def get_analytics(tenant_id: str, department: Optional[str] = None):
    return engine.get_tenant_analytics(tenant_id, department=department)

@app.get("/api/v1/plugin/queue/{tenant_id}")
async def get_queue(tenant_id: str, department: Optional[str] = None):
    return {
        "snapshot": engine.get_queue_snapshot(tenant_id, department=department),
        "serving": engine.get_serving_tickets(tenant_id, department=department)
    }

@app.get("/api/v1/plugin/qr/{tenant_id}")
async def generate_qr(tenant_id: str, host: Optional[str] = "http://localhost:5173"):
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

@app.get("/api/v1/plugin/ticket-qr/{ticket_id}")
async def generate_ticket_qr(ticket_id: str, host: Optional[str] = "http://localhost:5173"):
    target_url = f"{host}?ticket={ticket_id}"
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return {
        "ticket_id": ticket_id,
        "target_url": target_url,
        "qr_code_base64": f"data:image/png;base64,{img_str}"
    }

# ---------------------------------------------------------------------------
# Historical Data Ingestion & Multi-Tenant ML Endpoints
# ---------------------------------------------------------------------------
def _read_uploaded_file(file: UploadFile) -> pd.DataFrame:
    filename = file.filename.lower()
    contents = file.file.read()
    try:
        if filename.endswith(".csv"):
            return pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            return pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a CSV or Excel (.xlsx) file.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file '{file.filename}': {str(e)}")

@app.post("/api/v1/plugin/historical-data/preview")
async def preview_historical_data(
    tenant_id: str = Form(...),
    file: UploadFile = File(...)
):
    df = _read_uploaded_file(file)
    detected_columns = list(df.columns)

    suggested_mapping, unmapped, missing_required = detect_column_mappings(detected_columns)
    val_result = validate_and_transform_dataframe(df, suggested_mapping, default_tenant_id=tenant_id)

    # Prepare sample rows (first 5)
    sample_df = df.head(5).fillna("")
    sample_rows = sample_df.to_dict(orient="records")

    return {
        "tenant_id": tenant_id,
        "detected_columns": detected_columns,
        "suggested_mapping": suggested_mapping,
        "unmapped_columns": unmapped,
        "missing_required": missing_required,
        "validation_summary": {
            "total_rows": val_result["total_rows"],
            "valid_rows": val_result["valid_rows"],
            "rejected_rows": val_result["rejected_rows"],
            "warnings": val_result["warnings"],
            "errors": val_result["errors"],
        },
        "sample_rows": sample_rows
    }

@app.post("/api/v1/plugin/historical-data/upload")
async def upload_historical_data(
    tenant_id: str = Form(...),
    mapping_json: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    df = _read_uploaded_file(file)
    mapping = {}

    if mapping_json:
        try:
            mapping = json.loads(mapping_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid mapping JSON: {str(e)}")
    else:
        mapping, _, _ = detect_column_mappings(list(df.columns))

    val_result = validate_and_transform_dataframe(df, mapping, default_tenant_id=tenant_id)
    clean_df = val_result["clean_df"]

    if clean_df is None or len(clean_df) == 0:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "tenant_id": tenant_id,
                "message": "Data validation failed. No valid historical records could be parsed.",
                "errors": val_result["errors"],
                "warnings": val_result["warnings"],
            }
        )

    # Save to SQLite
    imported_count = engine.save_historical_records(tenant_id, clean_df)
    engine.save_tenant_mapping(tenant_id, mapping)

    # Check total historical rows in database
    total_stored = len(engine.get_historical_records(tenant_id))
    min_met = total_stored >= MIN_TRAINING_ROWS

    return {
        "success": True,
        "tenant_id": tenant_id,
        "imported_records": imported_count,
        "total_stored_records": total_stored,
        "rejected_records": val_result["rejected_rows"],
        "warnings": val_result["warnings"],
        "min_threshold_met": min_met,
        "min_required_rows": MIN_TRAINING_ROWS,
        "message": f"Successfully imported {imported_count} valid records into historical database. Total stored: {total_stored} records."
    }

@app.post("/api/v1/plugin/historical-data/train")
async def train_historical_model(payload: TrainTenantRequest):
    tenant_id = payload.tenant_id
    records = engine.get_historical_records(tenant_id)

    if records:
        df = pd.DataFrame(records)
    else:
        df = None

    meta = train_model_for_tenant(
        tenant_id=tenant_id,
        custom_df=df,
        min_rows=MIN_TRAINING_ROWS,
        data_source="historical_upload" if records else "synthetic"
    )
    engine.reload_model_cache(tenant_id)

    if "analytics_update" in dir(sio):
        await _broadcast_queue_update(tenant_id)

    return meta

@app.get("/api/v1/plugin/model-status/{tenant_id}")
async def get_model_status(tenant_id: str):
    return get_tenant_model_info(tenant_id)

# ---------------------------------------------------------------------------
# Authentication & Role Management Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/auth/signup")
async def signup(payload: SignupRequest):
    try:
        user_data = engine.register_user(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            role=payload.role or "user",
            department=payload.department or "all"
        )
        return {"status": "success", "user": user_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@app.post("/api/v1/auth/login")
async def login(payload: LoginRequest):
    try:
        user_data = engine.authenticate_user(
            email=payload.email,
            password=payload.password
        )
        return {"status": "success", "user": user_data}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.get("/api/v1/auth/me")
async def get_current_user(email: Optional[str] = None):
    if not email:
        raise HTTPException(status_code=400, detail="Email query parameter is required")
    user = engine.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": user}

@app.put("/api/v1/auth/profile")
async def update_profile(payload: UpdateProfileRequest):
    try:
        updated = engine.update_user_profile(
            email=payload.email,
            username=payload.username,
            phone=payload.phone or "",
            gender=payload.gender or "",
            age=payload.age or 0,
            medical_id=payload.medical_id or ""
        )
        return {"status": "success", "user": updated}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/auth/users")
async def get_all_users():
    users = engine.get_all_users()
    return {"status": "success", "users": users}

@app.get("/api/v1/auth/user-history/{email}")
async def get_user_history(email: str):
    tickets = engine.get_user_tickets(email)
    return {"status": "success", "tickets": tickets}

@app.get("/api/v1/admin/db-overview")
async def get_db_overview():
    try:
        from database import get_db_info
        data = engine.get_database_overview()
        return {"status": "success", "db_info": get_db_info(), "database": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.5.0"}

# ---------------------------------------------------------------------------
# Hybrid Slot Booking & Pre-scheduled Appointment Check-in Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/plugin/appointments/book")
async def book_appointment(req: BookAppointmentRequest):
    try:
        res = engine.book_appointment(
            tenant_id=req.tenant_id,
            consumer_type=req.consumer_type or "hospital",
            service_category=req.service_category,
            patient_name=req.patient_name,
            user_email=req.user_email or "",
            appointment_date=req.appointment_date,
            time_slot=req.time_slot
        )
        return {"status": "success", "appointment": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/plugin/appointments/check-in")
async def check_in_appointment(req: CheckInAppointmentRequest):
    try:
        res = engine.check_in_appointment(req.appointment_id)
        tenant_id = res["appointment"]["tenant_id"]
        await _broadcast_queue_update(tenant_id)
        return {"status": "success", "appointment": res["appointment"], "ticket": res["ticket"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/plugin/appointments/user/{email}")
def get_user_appointments(email: str):
    return {"appointments": engine.get_user_appointments(email)}

@app.get("/api/v1/plugin/appointments/tenant/{tenant_id}")
def get_tenant_appointments(tenant_id: str, department: Optional[str] = None):
    return {"appointments": engine.get_tenant_appointments(tenant_id, department=department)}

# ---------------------------------------------------------------------------
# Socket.IO Event Handlers
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
        user_email=data.get("user_email", ""),
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
    tenant_id = data.get("tenant_id", "global")
    records = engine.get_historical_records(tenant_id)
    df = pd.DataFrame(records) if records else None

    meta = train_model_for_tenant(tenant_id=tenant_id, custom_df=df)
    engine.reload_model_cache(tenant_id)

    await sio.emit("retrain_complete", meta, to=sid)
    await _broadcast_queue_update(tenant_id)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
