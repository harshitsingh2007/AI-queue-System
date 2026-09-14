# 🏥 AI-Powered Enterprise Multi-Hospital Queue Management System

An enterprise-grade, multi-tenant clinical workflow and queue intelligence platform built with **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL**, **Python AI Microservice**, **Socket.IO**, and **React 18 + Vite**.

Features priority-based triage (emergency vs. routine min-heap scheduling), real-time WebSocket state distribution, multi-model machine learning wait time forecasting, four independent portals, and strict hospital-level tenant isolation.

---

## 🏗️ System Architecture

```text
                                  +------------------------------+
                                  |     React 18 + Vite (SPA)    |
                                  |    (Port 5173 / Production)  |
                                  +---------------+--------------+
                                                  |
                         REST / WebSocket (Socket.IO)
                                                  v
                     +--------------------------------------------+
                     |         Node.js + Express Gateway          |
                     |         (Port 8000 / src/server.js)        |
                     +--------------+-----------------------------+
                                    |              |
                      Prisma Client |              | HTTP / Microservice
                                    v              v
         +-----------------------------+    +-----------------------------+
         |     PostgreSQL Database     |    |    Python AI Microservice   |
         |    (17 Normalized Tables)   |    |  (Port 8001 / ai_service.py)|
         +-----------------------------+    +-----------------------------+
```

---

## 🌟 Four Independent Portals

The platform provides four completely segregated user experiences with distinct identities, state, and permissions:

### 1. 📱 Patient Portal (`/` or `?tab=...`)
- **Self-Service Check-In**: Walk-in registration, department selection, and medical condition triage.
- **Appointments & Booking**: Book future slots or check in for today's appointment with instant ticket issuance.
- **Digital Boarding Pass**: Live queue position, estimated wait time in minutes, doctor assignment, and audio turn alert chimes.
- **Family Profiles**: Manage dependent profiles (children, parents, spouse) and queue on their behalf.
- **Bilingual Experience**: Instant toggle between English and Hindi (हिंदी).

### 2. 🩺 Doctor & Staff Portal (`?page=staff`)
- **Clinical Desk Operations**: Single-patient consultation lock (strictly ensures a doctor serves one patient at a time).
- **Serve Next Patient**: Automated highest-priority ticket retrieval powered by Min-Heap priority scheduling.
- **Consultation & Prescription**: Digital prescriptions (medicines, dosages, instructions), lab test requisitions, and diagnosis notes.
- **Inter-Department Transfer**: Seamless transfer to Pharmacy, Radiology, or Laboratory with new priority queue tickets.
- **Duty Status & Break Guard**: Real-time break status (`ACTIVE`, `TEA_BREAK`, `LUNCH_BREAK`, `EMERGENCY_ROUND`) preventing ticket misassignments while on duty pause.
- **Live Desks Read-Only Monitor**: Real-time counter status without unauthorized desk capacity tampering.

### 3. 🌐 Super Admin Portal (`?page=superadmin`)
- **Hospital Network Registry**: Create, manage, and monitor multi-tenant hospitals and clinic branches.
- **Staff & Doctor Allocation**: Register employees, assign roles (Doctors, Nurses, Receptionists, Admins), and assign physical consultation desks.
- **Desk & Kiosk Management**: Configure consultation desks and register dedicated hardware kiosk terminals.
- **White-Label Branding**: Customize hospital names, logos, color palettes, and operational hours per facility.

### 4. 🖥️ Dedicated Independent Kiosk Display (`/kiosk/:hospitalCode/:kioskCode`)
- **Standalone Viewport**: Full-screen (`100vw`, `100vh`) wall TV and iPad display mode free of patient/doctor navigation bars or login modals.
- **Now Serving & Next Up**: Large high-contrast display of currently consulted ticket numbers, assigned doctor desks, and upcoming queue list.
- **Hardware Heartbeat**: Automated background health ping updating hardware status and online metrics.
- **Privacy Enforcement**: Strips all sensitive personal health information (emails, phone numbers) to ensure public HIPAA/privacy compliance.

---

## 🗄️ PostgreSQL Schema & Record Explorer (`/db`)

A built-in PostgreSQL Database Inspector tailored for hospital operations:
- **Strict Hospital Tenant Isolation**: Queries and record previews are strictly scoped to the active facility (`hospital_id`), preventing cross-facility data leakage.
- **Role-Gated Access**: Accessible exclusively by **Receptionists**, **Staff**, and **Super Admins**. Doctors and patient roles are blocked from inspecting raw database schemas.
- **Clinical Focus**: Cleanly presents core operational tables (`users`, `hospitals`, `departments`, `patients`, `family_members`, `employees`, `desks`, `kiosks`, `appointments`, `tickets`, `service_logs`) while filtering out internal telemetry artifacts.

---

## 📁 Repository Structure

```text
AI-queue-System/
├── README.md                          # Project documentation
├── backend/
│   ├── package.json                   # Root backend scripts
│   ├── node-backend/                  # Primary Node.js / Express Application
│   │   ├── package.json               # Node.js dependencies
│   │   ├── prisma/
│   │   │   └── schema.prisma          # PostgreSQL 17-table Prisma Schema
│   │   ├── src/
│   │   │   ├── server.js              # Server entrypoint (HTTP & Socket.IO)
│   │   │   ├── config/                # Prisma client & database configuration
│   │   │   ├── controllers/           # Auth, Queue, Hospital, Doctor, Kiosk controllers
│   │   │   ├── routes/                # API v1 routes & middleware
│   │   │   ├── services/              # QueueEngine (Min-Heap), TicketService, AIService
│   │   │   ├── socket/                # Socket.IO room isolation & live event broadcasting
│   │   │   └── utils/                 # Priority scoring, seed scripts, i18n
│   │   └── tests/                     # 10 comprehensive automated test suites
│   └── python-ai/                     # Python AI Service
│       ├── ai_service.py              # FastAPI microservice for wait time inference
│       ├── train_model.py             # Ensemble model trainer (RandomForest, ExtraTrees, HGB)
│       ├── requirements.txt           # Python dependencies
│       └── models/                    # Serialized machine learning models (.pkl)
└── frontend/                          # React 18 Client Application
    ├── index.html                     # HTML Entrypoint
    ├── package.json                   # Frontend dependencies
    ├── vite.config.js                 # Vite build configuration
    └── src/
        ├── App.jsx                    # Root router, portal switcher & auth management
        ├── config/                    # API endpoints & hospital branding defaults
        ├── components/
        │   ├── Header.jsx             # Clinical navigation header bar
        │   ├── AdminHeroBanner.jsx    # Doctor / Staff operational metrics & counters
        │   ├── AccessDeniedGuard.jsx  # Role-based access control boundary
        │   └── kiosk/                 # KioskHeader, NowServing, NextQueue components
        ├── pages/
        │   ├── PatientPage.jsx        # Patient self-service & digital boarding pass
        │   ├── StaffPage.jsx          # Doctor & Staff consultation dashboard
        │   ├── SuperAdminPage.jsx     # Network hospital management
        │   ├── KioskPage.jsx          # Standalone public queue monitor display
        │   └── DatabaseInspectorPage.jsx # Hospital-scoped PostgreSQL schema explorer
        └── utils/                     # i18n (English & Hindi translations)
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10+
- **PostgreSQL** database instance running locally or on the cloud

### 1. Configure Environment Variables

Create `backend/node-backend/.env`:
```env
PORT=8000
DATABASE_URL="postgresql://username:password@localhost:5432/ai_queue?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
AI_SERVICE_URL="http://localhost:8001"
```

### 2. Install Dependencies

```bash
# Install Node.js backend dependencies
cd backend/node-backend
npm install
npx prisma generate

# Install Python AI microservice dependencies
cd ../python-ai
pip install -r requirements.txt

# Install Frontend dependencies
cd ../../frontend
npm install
```

---

## 💻 Running the Services Locally

Open three terminal windows:

### Terminal 1: Node.js Backend & WebSocket Server
```bash
cd backend/node-backend
npm start
```
*Server runs on:* `http://localhost:8000`

### Terminal 2: Python AI Microservice
```bash
cd backend/python-ai
python ai_service.py
```
*Microservice runs on:* `http://localhost:8001`

### Terminal 3: React Frontend (Vite)
```bash
cd frontend
npm run dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🧪 Automated Testing

The backend includes 10 comprehensive automated test suites running against the live PostgreSQL database:

```bash
cd backend/node-backend
npm test
```

### Verified Test Suites (100% Pass Rate):
1. **Authentication & Tenant Isolation**: Super Admin registration, Doctor creation, dual login (Email + ID), cross-tenant isolation.
2. **Family Profiles & Dependents**: Dependent CRUD, patient profile ownership isolation.
3. **Queue Lifecycle & Priority Min-Heap**: Priority triage ordering (Emergency ahead of Routine), consultation locks.
4. **Cancellation & Adjustment**: Ticket cancellation, queue postponement limits, anti-jumping guards.
5. **Daily Queue Closure & Expiration**: Midnight ticket expiration and state cleanups.
6. **Appointments & Check-in**: Future booking, on-day appointment check-in, duplicate prevention.
7. **Doctor Availability & Isolation**: Inactive doctor rejection, desk-to-doctor assignment validation.
8. **Doctor Duty Status & Break Guard**: Active/Break transitions, preventing ticket assignment during rounds or tea breaks.
9. **Real-Time Socket.IO**: Room isolation across multiple hospital tenants.
10. **Dedicated Kiosk Portal & Hardware**: Terminal heartbeats, sanitized queue privacy boundaries, and kiosk upsert operations.

---

## ⚙️ Production Build

To bundle the frontend for production deployment:

```bash
cd frontend
npm run build
```

The optimized assets will be emitted to `frontend/dist/`.

---

## 📄 License & System Attribution

Developed for **AI Queue System** — Enterprise Clinical Queue Optimization & Hospital Resource Management Platform.
