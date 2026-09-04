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
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import socketio
import qrcode

from queue_engine import engine, PRIORITY_EMERGENCY, PRIORITY_ROUTINE, PRIORITY_STANDARD, MAX_PATIENT_QUEUE_ADJUSTMENT
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
    age: Optional[int] = 30
    gender: Optional[str] = "other"
    medical_condition: Optional[str] = "general_checkup"
    pre_existing_condition: Optional[str] = "none"
    family_member_id: Optional[str] = None  # When joining queue for a family member

class ServeNextRequest(BaseModel):
    tenant_id: str
    service_category: Optional[str] = None
    department: Optional[str] = None  # Admin's department — enforces dept-scoped serving

class TicketActionRequest(BaseModel):
    tenant_id: str
    ticket_id: str
    department: Optional[str] = None  # Admin's department — enforces dept ownership check

class CancelTicketRequest(BaseModel):
    tenant_id: Optional[str] = "city-hospital-01"
    ticket_id: Optional[str] = None
    reason: Optional[str] = "No longer available"

class AdjustQueueRequest(BaseModel):
    tenant_id: Optional[str] = "city-hospital-01"
    ticket_id: Optional[str] = None
    positions: Optional[int] = None
    skip_positions: Optional[int] = None
    reason: Optional[str] = "Late arrival"

class TransferTicketRequest(BaseModel):
    tenant_id: str
    ticket_id: str
    target_department: str
    prescription_notes: Optional[str] = ""

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
    hospital_code: Optional[str] = "city-hospital-01"
    employee_id: Optional[str] = ""
    phone: Optional[str] = ""

class SuperAdminSignupRequest(BaseModel):
    email: str
    username: str
    password: str
    phone: Optional[str] = ""
    hospital_name: Optional[str] = ""
    hospital_code: Optional[str] = ""

class AdminSignupRequest(BaseModel):
    email: str
    username: str
    password: str
    phone: Optional[str] = ""
    hospital_code: Optional[str] = "city-hospital-01"

class PatientSignupRequest(BaseModel):
    email: str
    username: str
    password: str
    phone: Optional[str] = ""

def get_requester_email(request: Request) -> str:
    """Helper to extract user email from header for tenant isolation."""
    email_hdr = request.headers.get("x-user-email") or request.headers.get("X-User-Email")
    if email_hdr:
        return email_hdr.strip().lower()
    return ""

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

class FamilyMemberCreateRequest(BaseModel):
    name: str
    relation: str
    age: Optional[int] = 25
    gender: Optional[str] = "male"
    phone: Optional[str] = ""
    id: Optional[str] = None
    department: Optional[str] = "all"

class FamilyMemberUpdateRequest(BaseModel):
    name: str
    relation: str
    age: Optional[int] = 25
    gender: Optional[str] = "male"
    phone: Optional[str] = ""

class HospitalCreateRequest(BaseModel):
    hospital_code: str
    name: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    description: Optional[str] = ""
    logo_url: Optional[str] = ""
    status: Optional[str] = "active"

class HospitalUpdateRequest(BaseModel):
    name: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    description: Optional[str] = ""
    logo_url: Optional[str] = ""
    status: Optional[str] = "active"

class EmployeeCreateRequest(BaseModel):
    name: str
    email: str
    role: str
    department: str
    employee_id: Optional[str] = ""
    phone: Optional[str] = ""
    password: Optional[str] = "pass123"

class EmployeeUpdateRequest(BaseModel):
    name: str
    phone: Optional[str] = ""
    role: str = "staff"
    department: str = "consultation"
    employee_id: Optional[str] = ""
    status: Optional[str] = "active"

class DepartmentCreateRequest(BaseModel):
    dept_code: str
    name: str
    description: Optional[str] = ""

class DeskStatusUpdateRequest(BaseModel):
    status: str

class DeskCreateRequest(BaseModel):
    dept_code: str
    desk_name: str
    status: Optional[str] = "AVAILABLE"

class BookAppointmentRequest(BaseModel):
    tenant_id: str
    consumer_type: Optional[str] = "hospital"
    service_category: str
    patient_name: str
    user_email: Optional[str] = ""
    appointment_date: str
    time_slot: str
    family_member_id: Optional[str] = None  # When booking for a family member

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
async def join_queue_http_endpoint(req: JoinRequest, request: Request):
    priority = _urgency_to_priority(req.consumer_type, req.urgency)

    # Resolve family member patient_id if provided
    patient_id = None
    if req.family_member_id and req.user_email:
        try:
            fm = engine.verify_family_member_ownership(req.user_email, req.family_member_id)
            patient_id = fm.get("patient_id")
        except PermissionError as pe:
            raise HTTPException(status_code=403, detail=str(pe))
        except ValueError as ve:
            raise HTTPException(status_code=404, detail=str(ve))

    ticket = engine.join_queue(
        tenant_id=req.tenant_id,
        consumer_type=req.consumer_type,
        service_category=req.service_category,
        name=req.name,
        priority_level=priority,
        user_email=req.user_email or "",
        age=req.age or 30,
        gender=req.gender or "other",
        medical_condition=req.medical_condition or "general_checkup",
        pre_existing_condition=req.pre_existing_condition or "none",
        patient_id=patient_id,
    )
    engine.recalculate_wait_times(req.tenant_id)
    await _broadcast_queue_update(req.tenant_id)

    return {"status": "success", "ticket": ticket.to_dict()}

@app.post("/api/v1/plugin/queue/join")
async def join_queue_alt_endpoint(req: JoinRequest):
    return await join_queue_http_endpoint(req)

@app.post("/api/v1/plugin/serve-next")
async def serve_next(payload: ServeNextRequest):
    # Resolve effective department: explicit department field takes priority.
    effective_dept = payload.department or payload.service_category
    ticket = engine.serve_next(payload.tenant_id, service_category=None, department=effective_dept)
    if not ticket:
        raise HTTPException(status_code=404, detail="No waiting tickets in queue for this department.")

    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)
    await sio.emit("now_serving", {"ticket": ticket.to_dict()}, room=payload.tenant_id)

    return {"success": True, "now_serving": ticket.to_dict()}

@app.post("/api/v1/plugin/complete")
async def complete_ticket(payload: TicketActionRequest):
    try:
        ticket = engine.complete_ticket(payload.tenant_id, payload.ticket_id, department=payload.department)
        engine.recalculate_wait_times(payload.tenant_id)
        await _broadcast_queue_update(payload.tenant_id)
        return {"success": True, "completed_ticket": ticket.to_dict() if ticket else None}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@app.post("/api/v1/plugin/transfer-ticket")
async def transfer_ticket_endpoint(payload: TransferTicketRequest):
    try:
        orig_ticket, new_ticket = engine.transfer_ticket(
            tenant_id=payload.tenant_id,
            ticket_id=payload.ticket_id,
            target_department=payload.target_department,
            prescription_notes=payload.prescription_notes or "",
        )
        engine.recalculate_wait_times(payload.tenant_id)
        await _broadcast_queue_update(payload.tenant_id)
        await sio.emit("ticket_transferred", {
            "original_ticket": orig_ticket.to_dict(),
            "new_ticket": new_ticket.to_dict()
        }, room=payload.tenant_id)
        return {
            "success": True,
            "original_ticket": orig_ticket.to_dict(),
            "new_ticket": new_ticket.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/plugin/no-show")
async def mark_no_show(payload: TicketActionRequest):
    engine.mark_no_show(payload.tenant_id, payload.ticket_id)
    engine.recalculate_wait_times(payload.tenant_id)
    await _broadcast_queue_update(payload.tenant_id)
    return {"success": True}

@app.post("/api/v1/tickets/{ticket_id}/cancel")
@app.post("/api/v1/plugin/tickets/{ticket_id}/cancel")
@app.post("/api/v1/plugin/cancel")
async def cancel_ticket_api(
    request: Request,
    payload: Optional[CancelTicketRequest] = None,
    ticket_id: Optional[str] = None
):
    tid = ticket_id or (payload.ticket_id if payload else None)
    tenant_id = (payload.tenant_id if payload else None) or "city-hospital-01"
    reason = (payload.reason if payload else None) or "No longer available"

    if not tid:
        raise HTTPException(status_code=400, detail="Ticket ID is required.")

    requester_email = get_requester_email(request)

    try:
        cancelled_t = engine.cancel_ticket(tenant_id, tid, reason=reason, user_email=requester_email or None)
        if cancelled_t:
            await sio.emit("ticket_cancelled", {"ticket": cancelled_t.to_dict(), "ticket_id": tid}, room=tenant_id)
        await _broadcast_queue_update(tenant_id)
        return {
            "status": "success",
            "success": True,
            "ticket_id": tid,
            "status_code": 200,
            "ticket": cancelled_t.to_dict() if cancelled_t else None
        }
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        err_str = str(ve)
        if "not found" in err_str.lower():
            raise HTTPException(status_code=404, detail=err_str)
        if "only waiting" in err_str.lower() or "not waiting" in err_str.lower():
            raise HTTPException(status_code=409, detail=err_str)
        raise HTTPException(status_code=400, detail=err_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/tickets/{ticket_id}/adjust")
@app.post("/api/v1/tickets/{ticket_id}/adjust-queue")
@app.post("/api/v1/plugin/tickets/{ticket_id}/adjust-queue")
@app.post("/api/v1/plugin/adjust-queue")
async def adjust_queue_api(
    request: Request,
    payload: Optional[AdjustQueueRequest] = None,
    ticket_id: Optional[str] = None
):
    tid = ticket_id or (payload.ticket_id if payload else None)
    tenant_id = (payload.tenant_id if payload else None) or "city-hospital-01"

    # Support both 'positions' and 'skip_positions'
    skip_pos = 1
    if payload:
        if payload.positions is not None:
            skip_pos = payload.positions
        elif payload.skip_positions is not None:
            skip_pos = payload.skip_positions

    reason = (payload.reason if payload else None) or "Late arrival"

    if not tid:
        raise HTTPException(status_code=400, detail="Ticket ID is required.")

    if not isinstance(skip_pos, int) or skip_pos <= 0:
        raise HTTPException(status_code=400, detail="Invalid adjustment: positions must be a positive integer (cannot move forward or 0).")

    requester_email = get_requester_email(request)

    try:
        res = engine.adjust_queue_position(
            tenant_id,
            tid,
            skip_positions=skip_pos,
            user_email=requester_email or None,
            reason=reason
        )
        await sio.emit("ticket_updated", {"ticket": res["ticket"], "ticket_id": tid}, room=tenant_id)
        await _broadcast_queue_update(tenant_id)
        return {
            "status": "success",
            "success": True,
            "ticket_id": tid,
            "old_position": res["old_position"],
            "new_position": res["new_position"],
            "adjustment_count": res["adjustment_count"],
            "remaining_adjustment": res["remaining_adjustment"],
            "ticket": res["ticket"],
            "message": res["message"]
        }
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        err_str = str(ve)
        if "not found" in err_str.lower():
            raise HTTPException(status_code=404, detail=err_str)
        if "only waiting" in err_str.lower() or "not waiting" in err_str.lower():
            raise HTTPException(status_code=409, detail=err_str)
        raise HTTPException(status_code=400, detail=err_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/plugin/complete")
async def complete_ticket_rest(payload: TicketActionRequest):
    try:
        completed_t = engine.complete_ticket(payload.tenant_id, payload.ticket_id, department=payload.department)
        engine.recalculate_wait_times(payload.tenant_id)
        if completed_t:
            await sio.emit("ticket_completed", {"ticket": completed_t.to_dict()}, room=payload.tenant_id)
        await _broadcast_queue_update(payload.tenant_id)
        return {"success": True, "ticket": completed_t.to_dict() if completed_t else None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/plugin/ticket/{ticket_id}")
async def get_ticket_details(ticket_id: str, tenant_id: Optional[str] = "city-hospital-01"):
    tenant = engine._get_tenant(tenant_id)
    ticket = tenant["tickets"].get(ticket_id)
    if ticket:
        return {"status": "success", "ticket": ticket.to_dict()}
    
    with engine._get_db() as conn:
        r = conn.execute("SELECT * FROM tickets WHERE ticket_id = %s", (ticket_id,)).fetchone()
        if r:
            t_dict = dict(r)
            return {"status": "success", "ticket": t_dict}
            
    raise HTTPException(status_code=404, detail=f"Ticket #{ticket_id} not found.")

@app.post("/api/v1/plugin/re-announce")
async def re_announce_ticket(payload: TicketActionRequest):
    ticket = engine._get_tenant(payload.tenant_id)["tickets"].get(payload.ticket_id)
    if not ticket:
        with engine._get_db() as conn:
            r = conn.execute("SELECT * FROM tickets WHERE ticket_id = %s", (payload.ticket_id,)).fetchone()
            if r:
                ticket_dict = dict(r)
            else:
                raise HTTPException(status_code=404, detail=f"Ticket #{payload.ticket_id} not found.")
    else:
        ticket_dict = ticket.to_dict()

    await sio.emit("now_serving", {"ticket": ticket_dict}, room=payload.tenant_id)
    return {"success": True, "re_announced": ticket_dict}

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

    # Save to PostgreSQL
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
@app.post("/api/v1/plugin/train-model")
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

    return {
        "status": "success",
        "message": f"Successfully trained model for tenant '{tenant_id}'",
        "metrics": meta,
        **meta
    }

@app.get("/api/v1/plugin/model-status/{tenant_id}")
async def get_model_status(tenant_id: str):
    return get_tenant_model_info(tenant_id)

# ---------------------------------------------------------------------------
# Authentication & Role Management Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/auth/signup/superadmin")
async def signup_superadmin(payload: SuperAdminSignupRequest):
    try:
        user_data = engine.register_superadmin(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            phone=payload.phone or "",
            hospital_name=payload.hospital_name or "",
            hospital_code=payload.hospital_code or ""
        )
        return {"status": "success", "user": user_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Super Admin registration error: {str(e)}")

@app.post("/api/v1/auth/signup/admin")
async def signup_admin(payload: AdminSignupRequest):
    try:
        user_data = engine.register_admin(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            phone=payload.phone or "",
            hospital_code=payload.hospital_code or "city-hospital-01"
        )
        return {"status": "success", "user": user_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hospital Admin registration error: {str(e)}")

@app.post("/api/v1/auth/signup/patient")
@app.post("/api/v1/auth/signup")
async def signup_patient(payload: SignupRequest):
    try:
        # Public self-registration is strictly for Patient / Consumer accounts.
        # Staff and Doctor accounts must be provisioned by a Super Admin.
        user_data = engine.register_user(
            email=payload.email,
            username=payload.username,
            password=payload.password,
            role="user",
            department="all",
            phone=payload.phone or ""
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
async def get_user_history(email: str, name: Optional[str] = None):
    tickets = engine.get_user_tickets(email)
    if not tickets and name and name.strip().lower() != email.strip().lower():
        tickets = engine.get_user_tickets(name)
    return {"status": "success", "tickets": tickets}

@app.get("/api/v1/plugin/tickets/history/{identifier}")
async def get_ticket_history(identifier: str, name: Optional[str] = None):
    """Fetch ticket history for a patient by email, username, or patient name."""
    tickets = engine.get_user_tickets(identifier)
    if not tickets and name and name.strip().lower() != identifier.strip().lower():
        tickets = engine.get_user_tickets(name)
    return {"tickets": tickets, "count": len(tickets)}

# ---------------------------------------------------------------------------
# Family Member & Dependent Profile Endpoints
# ---------------------------------------------------------------------------
def _require_patient_role(email: str) -> dict:
    """Enforces that the requester has role=user/patient for family features."""
    from database import get_db_connection
    with get_db_connection() as conn:
        u = conn.execute(
            "SELECT id, role, username FROM users WHERE LOWER(email) = %s",
            (email.strip().lower(),)
        ).fetchone()
    if not u:
        raise HTTPException(status_code=401, detail="Authenticated user not found.")
    role = u[1]
    if role not in ("user", "patient"):
        raise HTTPException(
            status_code=403,
            detail="Family profiles are only available for patient/user accounts. Admins, doctors, and staff cannot use this feature."
        )
    return {"id": u[0], "role": role, "username": u[2]}

# --- Clean /api/v1/family-members endpoints (role=user enforced via X-User-Email header) ---

@app.get("/api/v1/family-members")
async def list_family_members(request: Request):
    """Get all family members for the authenticated patient user."""
    requester = get_requester_email(request)
    if not requester:
        raise HTTPException(status_code=401, detail="X-User-Email header is required.")
    _require_patient_role(requester)
    try:
        members = engine.get_family_members(requester)
        return {"status": "success", "members": members}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/family-members")
async def create_family_member(payload: FamilyMemberCreateRequest, request: Request):
    """Add a family member for the authenticated patient user."""
    requester = get_requester_email(request)
    if not requester:
        raise HTTPException(status_code=401, detail="X-User-Email header is required.")
    _require_patient_role(requester)
    try:
        member = engine.add_family_member(
            user_email=requester,
            name=payload.name,
            relation=payload.relation,
            age=payload.age or 25,
            gender=payload.gender or "male",
            phone=payload.phone or "",
            member_id=payload.id
        )
        return {"status": "success", "member": member}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/family-members/{member_id}")
async def update_family_member(member_id: str, payload: FamilyMemberUpdateRequest, request: Request):
    """Update a family member. Verifies ownership."""
    requester = get_requester_email(request)
    if not requester:
        raise HTTPException(status_code=401, detail="X-User-Email header is required.")
    _require_patient_role(requester)
    try:
        member = engine.update_family_member(
            user_email=requester,
            member_id=member_id,
            name=payload.name,
            relation=payload.relation,
            age=payload.age or 25,
            gender=payload.gender or "male",
            phone=payload.phone or ""
        )
        return {"status": "success", "member": member}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/family-members/{member_id}")
async def delete_family_member_clean(member_id: str, request: Request):
    """Delete a family member. Verifies ownership."""
    requester = get_requester_email(request)
    if not requester:
        raise HTTPException(status_code=401, detail="X-User-Email header is required.")
    _require_patient_role(requester)
    try:
        success = engine.delete_family_member(requester, member_id)
        if not success:
            raise HTTPException(status_code=404, detail="Family member not found or does not belong to your account.")
        return {"status": "success", "deleted_id": member_id}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Legacy endpoints: kept for backward compatibility, now also with role check ---

@app.get("/api/v1/users/{email}/family-members")
async def get_user_family_members(email: str, request: Request):
    try:
        members = engine.get_family_members(email)
        return {"status": "success", "members": members}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/users/{email}/family-members")
async def add_user_family_member(email: str, payload: FamilyMemberCreateRequest):
    try:
        member = engine.add_family_member(
            user_email=email,
            name=payload.name,
            relation=payload.relation,
            age=payload.age or 25,
            gender=payload.gender or "male",
            phone=payload.phone or "",
            member_id=payload.id
        )
        return {"status": "success", "member": member}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/users/{email}/family-members/{member_id}")
async def delete_user_family_member(email: str, member_id: str):
    try:
        success = engine.delete_family_member(email, member_id)
        if not success:
            raise HTTPException(status_code=404, detail="Family member not found")
        return {"status": "success", "deleted_id": member_id}
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/admin/db-overview")
async def get_db_overview():
    try:
        from database import get_db_info
        data = engine.get_database_overview()
        return {"status": "success", "db_info": get_db_info(), "database": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Super Admin & Multi-Hospital Management Endpoints (Tenant-Isolated)
# ---------------------------------------------------------------------------
@app.get("/api/v1/hospital/info/{hospital_code}")
async def get_hospital_info_endpoint(hospital_code: str):
    info = engine.get_hospital_info(hospital_code)
    return {"status": "success", "hospital": info}

@app.get("/api/v1/superadmin/overview")
async def get_superadmin_overview_endpoint(request: Request):
    requester = get_requester_email(request)
    overview = engine.get_superadmin_overview(requester_email=requester)
    return {"status": "success", "overview": overview}

@app.get("/api/v1/superadmin/hospitals")
async def get_superadmin_hospitals_endpoint(request: Request):
    requester = get_requester_email(request)
    hospitals = engine.get_all_hospitals(requester_email=requester)
    return {"status": "success", "hospitals": hospitals}

@app.post("/api/v1/superadmin/hospitals")
async def create_hospital_endpoint(payload: HospitalCreateRequest, request: Request):
    try:
        requester = get_requester_email(request)
        hospital = engine.create_hospital(
            hospital_code=payload.hospital_code,
            name=payload.name,
            address=payload.address or "",
            phone=payload.phone or "",
            email=payload.email or "",
            description=payload.description or "",
            logo_url=payload.logo_url or "",
            status=payload.status or "active",
            owner_email=requester
        )
        return {"status": "success", "hospital": hospital}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/superadmin/hospitals/{hospital_code}")
async def get_hospital_detail_endpoint(hospital_code: str, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this hospital's resources.")
    hospital = engine.get_hospital_by_code(hospital_code)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return {"status": "success", "hospital": hospital}

@app.put("/api/v1/superadmin/hospitals/{hospital_code}")
async def update_hospital_endpoint(hospital_code: str, payload: HospitalUpdateRequest, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have ownership of this hospital.")
    try:
        hospital = engine.update_hospital(
            hospital_code=hospital_code,
            name=payload.name,
            address=payload.address or "",
            phone=payload.phone or "",
            email=payload.email or "",
            description=payload.description or "",
            logo_url=payload.logo_url or "",
            status=payload.status or "active"
        )
        return {"status": "success", "hospital": hospital}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/superadmin/hospitals/{hospital_code}/employees")
async def get_hospital_employees_endpoint(hospital_code: str, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this hospital's employees.")
    employees = engine.get_hospital_employees(hospital_code)
    return {"status": "success", "employees": employees}

@app.post("/api/v1/superadmin/hospitals/{hospital_code}/employees")
async def add_hospital_employee_endpoint(hospital_code: str, payload: EmployeeCreateRequest, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot provision employees for another hospital.")
    try:
        user = engine.add_hospital_employee(
            hospital_code=hospital_code,
            name=payload.name,
            email=payload.email,
            role=payload.role,
            department=payload.department,
            employee_id=payload.employee_id or "",
            phone=payload.phone or "",
            password=payload.password or "pass123"
        )
        return {"status": "success", "employee": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/superadmin/hospitals/{hospital_code}/employees/{user_id}")
async def update_hospital_employee_endpoint(hospital_code: str, user_id: int, payload: EmployeeUpdateRequest, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to manage this employee.")
    try:
        user = engine.update_hospital_employee(
            user_id=user_id,
            name=payload.name,
            phone=payload.phone or "",
            role=payload.role,
            department=payload.department,
            employee_id=payload.employee_id or "",
            status=payload.status or "active"
        )
        return {"status": "success", "employee": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/superadmin/hospitals/{hospital_code}/employees/{user_id}")
async def delete_hospital_employee_endpoint(hospital_code: str, user_id: int, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to delete this employee.")
    try:
        res = engine.delete_hospital_employee(user_id=user_id)
        return {"status": "success", "result": res}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/superadmin/hospitals/{hospital_code}/departments")
async def get_hospital_departments_endpoint(hospital_code: str, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this hospital's departments.")
    departments = engine.get_hospital_departments(hospital_code)
    return {"status": "success", "departments": departments}

@app.post("/api/v1/superadmin/hospitals/{hospital_code}/departments")
async def add_hospital_department_endpoint(hospital_code: str, payload: DepartmentCreateRequest, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify departments for another hospital.")
    try:
        dept = engine.add_hospital_department(
            hospital_code=hospital_code,
            dept_code=payload.dept_code,
            name=payload.name,
            description=payload.description or ""
        )
        return {"status": "success", "department": dept}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/superadmin/hospitals/{hospital_code}/departments/{dept_code}")
async def delete_hospital_department_endpoint(hospital_code: str, dept_code: str, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You cannot delete departments from another hospital.")
    try:
        res = engine.delete_hospital_department(hospital_code=hospital_code, dept_code=dept_code)
        return {"status": "success", "result": res}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/superadmin/hospitals/{hospital_code}/desks")
async def get_hospital_desks_endpoint(hospital_code: str, request: Request):
    requester = get_requester_email(request)
    if requester and not engine.verify_hospital_access(hospital_code, requester):
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this hospital's desks.")
    desks_data = engine.get_hospital_desks(hospital_code)
    return {"status": "success", "desks": desks_data}

@app.post("/api/v1/superadmin/hospitals/{hospital_code}/desks")
async def add_hospital_desk_endpoint(hospital_code: str, payload: DeskCreateRequest):
    try:
        desk = engine.add_hospital_desk(
            hospital_code=hospital_code,
            dept_code=payload.dept_code,
            desk_name=payload.desk_name,
            status=payload.status or "AVAILABLE"
        )
        return {"status": "success", "desk": desk}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/superadmin/hospitals/{hospital_code}/desks/{desk_id}")
async def delete_hospital_desk_endpoint(hospital_code: str, desk_id: int):
    try:
        res = engine.delete_hospital_desk(desk_id=desk_id)
        return {"status": "success", "result": res}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/superadmin/hospitals/{hospital_code}/desks/{desk_id}/status")
async def update_desk_status_endpoint(hospital_code: str, desk_id: int, payload: DeskStatusUpdateRequest):
    try:
        desk = engine.update_desk_status(desk_id=desk_id, status=payload.status)
        return {"status": "success", "desk": desk}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.5.0"}

# ---------------------------------------------------------------------------
# Hybrid Slot Booking & Pre-scheduled Appointment Check-in Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/plugin/appointments/book")
async def book_appointment(req: BookAppointmentRequest, request: Request):
    try:
        # Resolve family member patient_id if provided
        patient_id = None
        if req.family_member_id and req.user_email:
            try:
                fm = engine.verify_family_member_ownership(req.user_email, req.family_member_id)
                patient_id = fm.get("patient_id")
            except PermissionError as pe:
                raise HTTPException(status_code=403, detail=str(pe))
            except ValueError as ve:
                raise HTTPException(status_code=404, detail=str(ve))

        res = engine.book_appointment(
            tenant_id=req.tenant_id,
            consumer_type=req.consumer_type or "hospital",
            service_category=req.service_category,
            patient_name=req.patient_name,
            user_email=req.user_email or "",
            appointment_date=req.appointment_date,
            time_slot=req.time_slot,
            patient_id=patient_id
        )
        return {"status": "success", "appointment": res}
    except HTTPException:
        raise
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
def get_user_appointments(email: str, name: Optional[str] = None):
    results = engine.get_user_appointments(email)
    if not results and name and name.strip().lower() != email.strip().lower():
        results = engine.get_user_appointments(name)
    return {"appointments": results}

@app.get("/api/v1/plugin/appointments/tenant/{tenant_id}")
def get_tenant_appointments(
    tenant_id: str,
    department: Optional[str] = None,
    active_only: bool = False,
):
    return {"appointments": engine.get_tenant_appointments(
        tenant_id,
        department=department,
        active_only=active_only,
    )}

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
async def join_room(sid, data):
    tenant_id = data.get("tenant_id", "default")
    await sio.enter_room(sid, tenant_id)

    snapshot = engine.get_queue_snapshot(tenant_id)
    serving = engine.get_serving_tickets(tenant_id)
    analytics = engine.get_tenant_analytics(tenant_id)

    await sio.emit("queue_update", {"snapshot": snapshot, "serving": serving}, to=sid)
    await sio.emit("analytics_update", analytics, to=sid)

@sio.event
async def transfer_ticket(sid, data):
    tenant_id = data.get("tenant_id", "default")
    ticket_id = data.get("ticket_id")
    target_department = data.get("target_department", "pharmacy")
    prescription_notes = data.get("prescription_notes", "")

    try:
        orig_ticket, new_ticket = engine.transfer_ticket(
            tenant_id=tenant_id,
            ticket_id=ticket_id,
            target_department=target_department,
            prescription_notes=prescription_notes,
        )
        engine.recalculate_wait_times(tenant_id)
        await _broadcast_queue_update(tenant_id)
        await sio.emit("ticket_transferred", {
            "original_ticket": orig_ticket.to_dict(),
            "new_ticket": new_ticket.to_dict()
        }, room=tenant_id)
        await sio.emit("transfer_success", {
            "original_ticket": orig_ticket.to_dict(),
            "new_ticket": new_ticket.to_dict()
        }, to=sid)
    except Exception as e:
        await sio.emit("error", {"message": f"Transfer failed: {str(e)}"}, to=sid)

@sio.event
async def re_announce(sid, data):
    tenant_id = data.get("tenant_id", "default")
    ticket = data.get("ticket")
    if ticket:
        await sio.emit("now_serving", {"ticket": ticket}, room=tenant_id)

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
    # Support both legacy 'service_category' and new 'department' field.
    department = data.get("department") or data.get("service_category")

    ticket = engine.serve_next(tenant_id, service_category=None, department=department)
    if not ticket:
        await sio.emit("error", {"message": "No waiting tickets in queue for this department."}, to=sid)
        return

    engine.recalculate_wait_times(tenant_id)
    await sio.emit("now_serving", {"ticket": ticket.to_dict()}, room=tenant_id)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def complete_ticket(sid, data):
    tenant_id = data["tenant_id"]
    ticket_id = data["ticket_id"]
    department = data.get("department")  # Admin's department for ownership check
    try:
        completed_t = engine.complete_ticket(tenant_id, ticket_id, department=department)
    except PermissionError as e:
        await sio.emit("error", {"message": str(e)}, to=sid)
        return
    engine.recalculate_wait_times(tenant_id)
    if completed_t:
        await sio.emit("ticket_completed", {"ticket": completed_t.to_dict()}, room=tenant_id)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def set_counters(sid, data):
    tenant_id = data["tenant_id"]
    count = data["active_counters"]
    engine.set_active_counters(tenant_id, count)
    await _broadcast_queue_update(tenant_id)

@sio.event
async def cancel_ticket(sid, data):
    tenant_id = data.get("tenant_id", "city-hospital-01")
    ticket_id = data.get("ticket_id")
    reason = data.get("reason", "User requested cancellation")
    user_email = data.get("user_email")
    try:
        cancelled_t = engine.cancel_ticket(tenant_id, ticket_id, reason=reason, user_email=user_email)
        if cancelled_t:
            await sio.emit("ticket_cancelled", {"ticket": cancelled_t.to_dict(), "ticket_id": ticket_id}, room=tenant_id)
        await _broadcast_queue_update(tenant_id)
    except Exception as e:
        await sio.emit("error", {"message": str(e)}, to=sid)

@sio.event
async def adjust_queue(sid, data):
    tenant_id = data.get("tenant_id", "city-hospital-01")
    ticket_id = data.get("ticket_id")
    skip_positions = data.get("positions") or data.get("skip_positions", 1)
    user_email = data.get("user_email")
    reason = data.get("reason", "Late arrival")
    try:
        res = engine.adjust_queue_position(
            tenant_id, ticket_id,
            skip_positions=int(skip_positions),
            user_email=user_email,
            reason=reason
        )
        await sio.emit("ticket_updated", {"ticket": res["ticket"], "ticket_id": ticket_id}, room=tenant_id)
        await _broadcast_queue_update(tenant_id)
        await sio.emit("adjust_queue_success", res, to=sid)
    except Exception as e:
        await sio.emit("error", {"message": str(e)}, to=sid)

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
