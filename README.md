# AI Queue System

Multi-tenant hospital queue platform: walk-in triage, appointments, live desk operations, kiosk displays, wait-time prediction, and hospital-scoped admin tools.

**Stack:** React 18 + Vite + Tailwind CSS 4 · Node.js + Express + Prisma + PostgreSQL · Socket.IO · FastAPI ML microservice (scikit-learn).

---

## Architecture

```text
                         React 18 + Vite  (http://localhost:5173)
                         REST + Socket.IO
                                    |
                                    v
                    Node.js Express gateway  (http://localhost:8000)
                    src/server.js · Prisma · Socket.IO
                           |                    |
                           v                    v
                  PostgreSQL (Prisma)     Python FastAPI ML
                                          (http://localhost:8001)
                                          backend/python-ai/ai_service.py
                                          models in backend/models/
```

On boot the Node server connects to PostgreSQL, hydrates today’s waiting tickets into in-memory min-heaps, seeds default kiosks if needed, and starts a daily queue-closure job.

Default tenant id: `city-hospital-01`. Frontend API/WebSocket base: `http://127.0.0.1:8000` (`frontend/src/config/hospitalConfig.js`).

---

## Portals

Routing is query- and path-based in `frontend/src/App.jsx` (not a separate React Router tree). Auth is required for operational portals.

| Portal | How to open | Who |
| --- | --- | --- |
| Patient | `/` or `?tab=walkin\|book\|my_apts\|history\|family` | Patients |
| Staff / doctor desk | `?page=staff` | Admin, doctor, staff, receptionist |
| Super admin | `?page=superadmin` | Super admin |
| ML studio | `?page=admin` or `?page=ml` | Staff / admin |
| Database inspector | `?page=db` | Receptionist, staff, super admin |
| Public kiosk | `/kiosk/:hospitalCode/:kioskCode` | Unauthenticated display |

### Patient portal

- Walk-in check-in with department / category, symptoms, and emergency vs routine triage
- Appointment booking and same-day appointment check-in (ticket issued)
- Live boarding pass: position, predicted wait, QR, print helpers, turn audio
- Family / dependent profiles (queue on their behalf)
- Visit history: diagnoses, prescriptions, lab-style reports (`visit_history`, `prescriptions`, `medical_reports`)
- English / Hindi toggle

### Staff & doctor desk

- Serve next from the priority heap (one consultation lock per doctor)
- Complete, hold, recall, no-show, cancel, postpone (anti-jumping limits)
- Digital prescription, lab tests, notes; transfer to pharmacy / radiology / lab
- Duty status: `ACTIVE`, `TEA_BREAK`, `LUNCH_BREAK`, `EMERGENCY_ROUND` (no assignment while paused)
- Patient history on the current ticket; live queue + analytics over Socket.IO

### Super admin

- Register and brand hospitals (name, logo, colors, hours)
- Staff, desks, departments, and kiosk terminals
- Network-level hospital switching

### ML studio

- Upload CSV/Excel historical service data
- Column mapping preview, ingest into `tenant_historical_data`
- Train a tenant model; view model status / metrics
- Node proxies to the Python service (`/api/v1/plugin/historical-data/*`, `/train-model`, `/model-status/:tenantId`)

### Database inspector

- Hospital-scoped table preview (`hospital_id` isolation)
- Clinical tables shown; telemetry tables (`audit_logs`, `tenant_mapping`, `tenant_config`, `tenant_historical_data`) hidden from the explorer UI
- Doctors and patients cannot open this page

### Kiosk display

- Full-screen now serving / next up / summary
- Heartbeat so terminals stay marked online
- Public view omits emails, phones, and other personal fields

---

## Queue and ML behavior

- **Priority min-heap** (`queueEngine.js`): sort key is `(priority_level, effective_timestamp, ticket_id)`. Emergency tickets outrank routine.
- **Clinical complexity** (`clinicalComplexity.js`) feeds predicted service duration.
- **Wait times:** Node calls `AI_SERVICE_URL` (`POST /predict`). If no model is loaded, the Python service uses a category heuristic (consultation, emergency, pharmacy, lab, radiology, etc.).
- **Models:** per-tenant `backend/models/{tenant_id}/queue_predictor.pkl` with fallback to `backend/models/global/`. Training compares Random Forest, Extra Trees, and HistGradientBoosting and stores the best bundle + `metadata.json`.
- **Midnight closure:** `dailyClosureJob` expires leftover tickets for the hospital timezone (`HOSPITAL_TIMEZONE`, default `Asia/Kolkata`).
- **Realtime:** Socket.IO rooms are hospital/tenant ids. Events include `queue_update`, `analytics_update`, `turn_alert`, join/serve/complete/hold/recall, duty status, and related ticket actions.

---

## Auth and isolation

- JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`)
- Sign up: patient, hospital admin, super admin
- Email OTP verification and password reset via SMTP (`emailService.js`); without SMTP credentials the app logs a development fallback
- Optional legacy email auth: `ALLOW_LEGACY_EMAIL_AUTH`
- Hospital isolation middleware scopes queries to the active facility
- Roles: `user` / patient, `doctor`, `staff`, `receptionist`, `admin`, `super_admin`

---

## PostgreSQL schema

Prisma schema: `backend/node-backend/prisma/schema.prisma`. Database name in local docs: `ai_queue`.

**Operational:** `hospitals`, `users`, `patients`, `family_members`, `employees`, `departments`, `desks`, `kiosks`, `appointments`, `appointment_status_history`, `tickets`, `queue_events`, `service_logs`

**Clinical history:** `visit_history`, `prescriptions`, `medical_reports`

**Auth / ops:** `verification_tokens`, `audit_logs`

**ML / tenancy:** `tenant_config`, `tenant_mapping`, `tenant_historical_data`

(`test_table` exists in the schema; it is not part of the product UI.)

---

## API surface (Node, `/api/v1`)

Health: `GET /health`

| Area | Prefix |
| --- | --- |
| Auth | `/api/v1/auth` |
| Queue / counters / analytics | `/api/v1/plugin` |
| Tickets | `/api/v1` and `/api/v1/plugin` |
| Appointments | `/api/v1/plugin/appointments` |
| Family members | `/api/v1/family-members` |
| Hospital / superadmin / admin | `/api/v1/hospital`, `/api/v1/superadmin`, `/api/v1/admin` |
| Historical data & train | `/api/v1/plugin/historical-data`, `/api/v1/plugin/train-model` |
| QR | `/api/v1/plugin/qr`, `/api/v1/plugin/ticket-qr` |
| Doctor duty | `/api/v1/doctor` |
| Kiosks | `/api/v1/kiosk`, `/api/v1/hospitals/:code/kiosks` |
| Patient history | `/api/v1/patients`, `/api/v1/tickets/:ticketId/patient-history` |

Python ML (direct): `GET /health`, `POST /predict`, `POST /train`, `GET /model-status/{tenant_id}`, `POST /preview-historical`, `POST /validate-historical`.

---

## Repository layout

```text
AI-queue-system/
├── README.md
├── frontend/                          # Vite + React 18 SPA
│   ├── src/
│   │   ├── App.jsx                    # Portal switcher, auth, Socket.IO
│   │   ├── config/hospitalConfig.js
│   │   ├── pages/                     # Patient, Staff, SuperAdmin, Kiosk, ML, DB
│   │   ├── components/                # common, patient, staff, kiosk, patient-history
│   │   ├── hooks/                     # usePatientHistory
│   │   ├── services/
│   │   └── utils/                     # i18n, print, voice, favicon
│   └── vite.config.js                 # port 5173
└── backend/
    ├── package.json                   # proxies start/dev/test to node-backend
    ├── train_model.py                 # ensemble trainer (imported by FastAPI)
    ├── schema_validator.py
    ├── data_importer.py
    ├── requirements.txt               # full Python deps (Excel, sklearn, FastAPI)
    ├── models/                        # global + per-tenant .pkl + metadata.json
    ├── .env.example                   # Template — copy to backend/.env
    ├── .env                           # Local secrets (gitignored, not committed)
    ├── python-ai/
    │   ├── ai_service.py              # FastAPI on port 8001
    │   └── requirements.txt           # slim FastAPI/sklearn set
    └── node-backend/
        ├── prisma/schema.prisma
        ├── loadEnv.js                 # Loads ../.env for Node and Prisma
        ├── src/
        │   ├── server.js
        │   ├── app.js
        │   ├── config/                # env, prisma
        │   ├── routes/
        │   ├── controllers/
        │   ├── services/              # queueEngine, tickets, AI proxy, email
        │   ├── socket/
        │   ├── jobs/dailyClosureJob.js
        │   ├── middleware/            # auth, roles, hospital isolation
        │   └── utils/
        └── tests/                     # 10 live-DB suites + run_all_tests.js
```

`frontend/src/pages/HubPage.jsx` is a leftover launchpad and is not wired in `App.jsx`.

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (create database `ai_queue`)

---

## Environment

Copy `backend/.env.example` to `backend/.env`. Node, Prisma, and the Python ML service all read that one file. Do not add another `.env` under `node-backend` or `python-ai`.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_queue"
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"
HOSPITAL_TIMEZONE="Asia/Kolkata"
PORT=8000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
AI_SERVICE_URL="http://localhost:8001"
AI_SERVICE_PORT=8001
ALLOW_LEGACY_EMAIL_AUTH=false

# Optional — email OTP / password reset
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Hex Visionaries <noreply@example.com>"
```

Point `DATABASE_URL` at your instance. Do not commit real secrets.

---

## Install

```bash
# Node API
cd backend/node-backend
npm install
npm run prisma:generate

# Python ML (use backend/requirements.txt so Excel ingest and trainer imports work)
cd ../
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

Apply or sync the Prisma schema from `backend/node-backend` with `npm run prisma:generate` and `npm run prisma:pull` so `DATABASE_URL` is loaded from `backend/.env`.

---

## Run locally

Three processes:

**1. Node API + Socket.IO**

```bash
cd backend/node-backend
npm start
```

http://localhost:8000 — `GET /health` should report `database: "connected"`.

From `backend/` you can also run `npm start`.

**2. Python ML**

```bash
cd backend/python-ai
python ai_service.py
```

http://localhost:8001 — `GET /health`. The service adds the parent `backend/` folder to `sys.path` so it can import `train_model` and `schema_validator`.

**3. Frontend**

```bash
cd frontend
npm run dev
```

http://localhost:5173

---

## Tests

Suites hit a live PostgreSQL database (not mocks). They create/clean tenant data as they run.

```bash
cd backend/node-backend
npm test
```

1. Authentication and tenant isolation  
2. Family profiles  
3. Queue lifecycle and priority heap  
4. Cancellation and position adjustment  
5. Daily closure / expiration  
6. Appointments and check-in  
7. Doctor availability and desk assignment  
8. Doctor duty / break guard  
9. Socket.IO room isolation  
10. Kiosk heartbeat and public payload sanitization  

Utility: `npm run db:clean-dummy` removes dummy seed rows (`src/utils/cleanDummyData.js`).

---

## Production frontend build

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`. Preview: `npm run preview`.

Set `FRONTEND_URL` and CORS-related env on the Node server to the deployed origin. Point `API_BASE` / `WS_URL` in `hospitalConfig.js` (or replace with build-time env) at the production API.

---

## License

ISC (see `backend/node-backend/package.json`). Built as the AI Queue System hospital operations platform.
