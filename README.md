# AI Queue System — Enterprise Clinical Queue & Telemetry Platform

[![Stack: React 18](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend: Node Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database: PostgreSQL + Prisma](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma-336791?logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![ML Service: FastAPI + Scikit-Learn](https://img.shields.io/badge/ML%20Engine-FastAPI%20%7C%20Scikit--Learn-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Realtime: Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Compliance: NABH Ready](https://img.shields.io/badge/Healthcare-NABH%2015--min%20Benchmark-E11D48)](#super-admin-360-operations)

A multi-tenant, real-time hospital queue management platform engineered for high-volume outpatient clinics, multi-specialty hospitals, and emergency triage. Seamlessly orchestrates walk-in triage, appointment check-ins, live clinician consultation desks, public waiting room displays, AI-driven wait-time forecasting, and executive operational oversight.

---

## System Architecture

```text
                           React 18 + Vite (SPA)
                        http://localhost:5173  (Web / Mobile / Kiosk)
                                     │
                     REST API (HTTP) │ WebSocket (Socket.IO)
                                     ▼
                    Node.js Express Gateway (Port 8000)
                     ├── Priority Min-Heap In-Memory Engine
                     ├── Tenant Isolation Middleware
                     ├── Prisma ORM & Database Layer
                     └── Socket.IO Hospital Room Broadcasting
                            │                      │
             Prisma Queries │                      │ REST Proxy (/predict, /train)
                            ▼                      ▼
               PostgreSQL Database         Python FastAPI ML Service
              (Clinical & Queue Data)             (Port 8001)
                                           ├── Per-Tenant Scikit-Learn Models
                                           └── Clinical Complexity Heuristics
```

---

## Core Portals & Capabilities

Routing is dynamically coordinated via query parameters and paths in [`frontend/src/App.jsx`](file:///c:/Users/HARSHIT%20SINGH/OneDrive/Apps/Desktop/AI-queue-system/frontend/src/App.jsx) with role-based access control.

| Portal | URL / Route | Primary Audience | Key Responsibilities |
| --- | --- | --- | --- |
| **Patient Portal** | `/` or `?tab=walkin\|book\|my_apts\|history\|family` | Patients & Dependents | Walk-in triage check-in, appointments, digital QR passes, turn chimes, visit & prescription history |
| **Doctor & Staff Desk** | `?page=staff` | Doctors, Nurses, Receptionists | Serve next from priority heap, digital Rx/lab orders, hold/recall, doctor duty break controls |
| **Super Admin 360°** | `?page=superadmin` | Hospital Administrators, CXOs | Multi-hospital directory, live clinical telemetry heatmap, doctor productivity, visited patient audit export |
| **Waiting Room Kiosk TV** | `/kiosk/:hospitalCode/:kioskCode` | Public Waiting Area | Full-screen high-contrast display, synthesized audio turn announcements, live queue numbers |
| **ML Intelligence Studio** | `?page=admin` or `?page=ml` | Data Engineers, Admins | Upload historical service logs (CSV/Excel), train per-tenant wait models, evaluate accuracy |
| **Database Inspector** | `?page=db` | Technical Staff, Admins | Hospital-isolated clinical table explorer with read-only record previews and data verification |

---

### 1. Patient Portal
* **Walk-In & Emergency Triage**: Patients select department, clinician category, chief complaints, and declare emergency symptoms (automatically elevating queue priority level).
* **Appointment Check-in**: Synchronous booking and same-day arrival verification with immediate digital queue token generation.
* **Live Digital Boarding Pass**: Real-time position tracker, AI-estimated wait time, doctor desk assignment, and turn notification chimes.
* **Family Member Profiles**: Manage dependents and schedule/queue on behalf of family members.
* **Clinical Visit History**: Secure record of past diagnoses, prescriptions, and lab test results.
* **Bilingual Support**: Instant Hindi (हिंदी) and English language toggle.

### 2. Doctor & Staff Clinical Desk
* **Priority Min-Heap Queue**: Sorts patients by priority level (Emergency outranks Routine), triage timestamp, and ticket ID.
* **Consultation Lock**: One active consultation lock per clinician desk with hold, recall, complete, and postpone workflows.
* **Electronic Health Records (EHR)**: In-session digital prescription builder, diagnostic orders, and internal transfer to Radiology, Pathology, or Pharmacy.
* **Clinician Duty Lifecycle**: Toggle status between `ACTIVE`, `TEA_BREAK`, `LUNCH_BREAK`, and `EMERGENCY_ROUND` to pause ticket routing.

### 3. Super Admin 360° Operations Command
* **Real-Time Clinical Telemetry & Patient Flow Heatmap**: Silky Bézier spline projections mapping patient footfall inflow, doctor consultation speed, and NABH 15-minute benchmark wait compliance across all hours of operation. Filterable by `Today (Live)`, `Yesterday`, `7 Days`, and `Month`.
* **Clinician Productivity Grid**: Comprehensive doctor workload metrics, total consultations completed, and turnaround time compliance.
* **Visited Patients Audit Directory**: Complete historical audit log with searchable, paginated records and **1-Click CSV Data Export** (`Download All Visits (CSV)` & `Download Filtered (CSV)`).
* **1-Click Executive NABH Compliance Report**: Generates an audit-ready executive daily summary calculating department bottlenecks, compliance scoring, and printable reports.
* **Facility Branding Studio**: White-label hospital name, logo, accent colors, address, and daily operating hours.

### 4. Public Waiting Room Kiosk TV
* **High-Definition Display**: Huge now-serving tokens, assigned doctor rooms/desks, and flashing emergency alerts.
* **Automated Audio Chimes**: Web Speech synthesized voice broadcasting ticket numbers in real time.
* **Privacy Sanitization**: Public payloads strictly redact phone numbers, emails, and sensitive personal identifiers.

### 5. ML Intelligence & Wait Time Prediction
* **Ensemble Learning**: Compares Random Forest, Extra Trees, and HistGradientBoosting regressors to select the highest-performing model per hospital.
* **Clinical Complexity Scoring**: Considers patient age, department complexity, emergency severity, and current waiting load to forecast consultation durations.
* **Heuristic Failover**: Gracefully falls back to clinical domain heuristics if hospital dataset models are still training.

---

## Tech Stack

| Domain | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **API Gateway** | Node.js (ESM), Express.js, Socket.IO, Prisma Client, JWT, Nodemailer |
| **Machine Learning** | Python 3.10+, FastAPI, Scikit-Learn, Pandas, NumPy, OpenPyXL |
| **Database** | PostgreSQL, Prisma ORM (Schema Migrations & Multi-Tenant Scoping) |
| **Testing** | Node test runner, Custom Live Database Integration Suites |

---

## Repository Structure

```text
AI-queue-system/
├── frontend/
│   ├── index.html                     # Application entry point
│   ├── main.jsx                       # React DOM root mounting
│   ├── vite.config.js                 # Vite bundler configuration
│   └── src/
│       ├── App.jsx                    # Top-level portal switcher & Socket.IO provider
│       ├── config/hospitalConfig.js   # API endpoints and hospital branding defaults
│       ├── pages/                     # Patient, Staff, SuperAdmin, Kiosk, MLAdmin, DB
│       ├── components/
│       │   ├── common/                # Header, Footer, AuthModal, ErrorBoundary, Icons
│       │   ├── patient/               # WalkinTab, BookSlotTab, DigitalPass, FamilyManagement
│       │   ├── patient-history/       # MedicalReports, PrescriptionHistory, Timeline
│       │   ├── staff/                 # AdminHeroBanner, DoctorShiftSummaryModal
│       │   └── superadmin/            # Modals, Telemetry Heatmap, Productivity, Visited Patients
│       ├── hooks/                     # Custom React hooks (usePatientHistory, etc.)
│       ├── services/                  # Frontend API client abstractions
│       └── utils/                     # i18n, speech synthesizer, dynamic favicon, print helpers
│
└── backend/
    ├── requirements.txt               # Complete Python ML dependencies
    ├── train_model.py                 # Ensemble model training pipeline
    ├── schema_validator.py            # Historical CSV/Excel data validation
    ├── data_importer.py               # Data ingestion helpers
    ├── models/                        # Serialized .pkl model weights & metadata
    ├── python-ai/
    │   ├── ai_service.py              # FastAPI microservice (Port 8001)
    │   └── requirements.txt           # Lightweight production inference requirements
    └── node-backend/
        ├── package.json               # Backend dependencies and test scripts
        ├── prisma/
        │   └── schema.prisma          # Database schema (PostgreSQL)
        ├── src/
        │   ├── server.js              # Server entry point & Socket.IO listener
        │   ├── app.js                 # Express application & route registrations
        │   ├── controllers/           # Request handlers for auth, queues, hospitals, visits
        │   ├── services/              # queueEngine (heap), ticketService, aiService, emailService
        │   ├── socket/                # Real-time event rooms & broadcast dispatchers
        │   ├── middleware/            # JWT authentication, role guards, tenant isolation
        │   └── jobs/dailyClosureJob.js# Automatic midnight ticket expiration job
        └── tests/                     # 10 comprehensive live-database integration test suites
```

---

## Installation & Setup

### Prerequisites
* **Node.js** v18+ and **npm**
* **Python** 3.10+ and **pip**
* **PostgreSQL** running locally or via a cloud provider (e.g. Supabase, Neon)

---

### 1. Configure Environment Variables
Create a `.env` file inside `backend/` by copying the example template:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ai_queue?schema=public"

# Security & Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"

# Gateway & Ports
PORT=8000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
HOSPITAL_TIMEZONE="Asia/Kolkata"

# ML Microservice
AI_SERVICE_URL="http://localhost:8001"
AI_SERVICE_PORT=8001

# Optional Email / OTP Service (Leave blank for console fallback)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="AI Queue System <noreply@hospital.com>"
```

---

### 2. Install Dependencies

#### Node.js Backend & Database Setup
```bash
cd backend/node-backend
npm install
npm run prisma:generate
npm run prisma:push    # Sync schema to your PostgreSQL database
```

#### Python AI Service
```bash
cd ../python-ai
pip install -r requirements.txt
```

#### Frontend Application
```bash
cd ../../frontend
npm install
```

---

## Running the Application Locally

You will need three terminal windows:

### Terminal 1: Node.js API Gateway & Socket.IO
```bash
cd backend/node-backend
npm run dev
```
* **Endpoint**: `http://localhost:8000`
* **Health Check**: `http://localhost:8000/health` (Returns `{ status: "ok", database: "connected" }`)

### Terminal 2: Python AI & ML Microservice
```bash
cd backend/python-ai
python ai_service.py
```
* **Endpoint**: `http://localhost:8001`
* **Health Check**: `http://localhost:8001/health`

### Terminal 3: Vite React Frontend
```bash
cd frontend
npm run dev
```
* **Endpoint**: `http://localhost:5173`

---

## Integration & Live Tests

The project includes 10 comprehensive integration test suites that run against a live PostgreSQL database to guarantee queue priority order, tenant isolation, and atomic operations.

To run the full test suite:
```bash
cd backend/node-backend
npm test
```

### Verified Test Suites:
1. **Authentication & Tenant Isolation**: Cross-tenant data boundary verification.
2. **Family Member Profiles**: Multi-dependent triage permissions.
3. **Queue Lifecycle & Min-Heap**: Priority ordering (Emergency triage vs. Routine).
4. **Cancellation & Postponement**: Anti-queue jumping guards and position re-calculation.
5. **Daily Midnight Closure Job**: Ticket lifecycle expiration at operational midnight.
6. **Appointments & Check-in**: Verification of time slot bookings and arrival tokens.
7. **Doctor Desk Locking**: Single-patient consultation locks.
8. **Clinician Duty Status**: Routing pauses during lunch and tea breaks.
9. **Socket.IO Room Isolation**: Message containment within hospital tenant rooms.
10. **Kiosk Sanitization**: Redaction of personal data on public terminal endpoints.

---

## Production Build

To create an optimized production bundle of the React frontend:

```bash
cd frontend
npm run build
```

The compiled assets will be output to `frontend/dist/`, ready for deployment to any static hosting provider (e.g. Vercel, Netlify, Cloudflare Pages, or Nginx).

---

## License

This project is licensed under the [ISC License](file:///c:/Users/HARSHIT%20SINGH/OneDrive/Apps/Desktop/AI-queue-system/backend/node-backend/package.json). Developed for intelligent, human-centric clinical workflow orchestration.
