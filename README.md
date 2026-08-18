# 🤖 AI-Powered Smart Queue Management System

A multi-tenant, AI-powered Queue Management System built with **FastAPI**, **Socket.IO**, **SQLite**, **Scikit-Learn**, and **React**. Supports embeddable widgets, arbitrary customer dataset ingestion with automatic column standardization, multi-model ensemble training, priority triage jumping, dedicated user/admin pages, and a QR code kiosk system.

---

## 📁 Repository Structure

```text
AI-queue-System/
├── .gitignore               # Excludes node_modules, venv, dist, sqlite DBs, .env
├── README.md                # Project documentation
├── backend/
│   ├── main.py              # FastAPI + Socket.IO REST & WebSocket Server
│   ├── queue_engine.py      # Core Min-Heap Priority Queue Engine & SQLite Persistence
│   ├── schema_validator.py  # Canonical Schema & Slashed Column Auto-Detection Engine
│   ├── data_importer.py     # Flexible CSV/Excel Historical Data Importer
│   ├── train_model.py       # Multi-Model Ensemble Evaluator (ExtraTrees, RF, HGB)
│   ├── requirements.txt     # Python Dependencies
│   └── models/              # Hierarchical Trained ML Model Registry
│       └── global/
│           ├── queue_predictor.pkl
│           └── metadata.json
└── frontend/
    ├── index.html           # HTML Entrypoint
    ├── main.jsx            # React Entry Point
    ├── App.jsx              # Multi-Page Navigation App (User, Admin, ML Studio, Embed, QR)
    ├── QueuePluginWidget.jsx # Glassmorphism Embeddable Queue Widget
    ├── package.json         # Frontend Dependencies
    └── vite.config.js       # Vite Configuration
```

---

## 🚀 Quickstart & Installation

### 1. Backend Setup (FastAPI + Socket.IO)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate

pip install -r requirements.txt
```

### 2. Train Initial Baseline ML Model

```bash
python train_model.py
```
*Evaluates GradientBoosting, ExtraTrees, and RandomForest models and saves `models/global/queue_predictor.pkl`.*

### 3. Start Backend Server

```bash
python -m uvicorn main:socket_app --port 8000
```
*Health Check URL:* `http://localhost:8000/health`

---

### 4. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
*App Access URL:* `http://localhost:5173/`

---

## 🌟 Key Features

### 1. Dedicated Multi-Page Portal
* **📱 Customer Queue Portal**: Self-checkin kiosk, priority triage selection (`🚨 Emergency (Priority 1)` vs `📋 Routine (Priority 2)`), digital boarding pass countdown timer, and audio chime alerts.
* **🛡️ Staff Admin Dashboard**: Real-time Analytics Cards, active counter count controls, **Call Next Priority Ticket**, Now Serving desk monitor, and live queue table.
* **📊 ML Studio & Training**: Historical CSV/Excel dataset upload, auto-detected column badges, custom column mapping overrides, validation breakdown box, and active model health card.
* **🔌 Plugin & Embed Portal**: Copy-paste 1-line JavaScript embed snippet generator and live floating widget preview.
* **🔲 QR Kiosk & Scanner**: Kiosk QR code generator and staff QR ticket scanner.

### 2. Multi-Tenant Custom Dataset Standardization
* Accepts CSV / Excel files with arbitrary column names (e.g. `Timestamp / Date-Time`, `Queue Length / Waiting Count`, `Active Counters / Staff`, `Service Category / Department`, `Service Duration / Handling Time`).
* Case-insensitive normalization, fuzzy alias matching, sub-token compound header parser, and data validation engine (rejection rules, unit conversion, feature derivation).
* Automatically falls back to Global Model if custom tenant dataset is under 500 rows.

---

## ⚙️ License & Author

Developed for **AI Queue System** — Multi-Tenant SaaS & Embedded Plugin Platform.
