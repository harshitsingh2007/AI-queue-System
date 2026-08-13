# AI-Powered Smart Queue Plugin — Setup & Test Guide

## Project layout

```
queue-plugin/
├── backend/
│   ├── train_model.py       # generates synthetic data + trains RandomForest
│   ├── queue_engine.py       # PluginQueueEngine: min-heap + ML predictions
│   ├── main.py                # FastAPI + Socket.IO server
│   ├── requirements.txt
│   └── queue_predictor.pkl   # created after you run train_model.py
└── frontend/
    ├── QueuePluginWidget.jsx  # the embeddable widget
    └── App.jsx                 # mock host site + staff dashboard demo
```

## 1. Backend setup

```bash
cd queue-plugin/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

## 2. Train the ML wait-time model

```bash
python train_model.py
```

You should see output like:

```
Model trained. Test MAE: 1.6 minutes
Saved trained model bundle -> queue_predictor.pkl
```

This creates `queue_predictor.pkl`, which `queue_engine.py` loads automatically
on startup. **You must run this once before starting the server** — if the
file is missing, the engine falls back to a flat 10-minute estimate so the
app still runs, just without real predictions.

## 3. Start the backend server

```bash
uvicorn main:socket_app --reload --port 8000
```

Check it's alive:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## 4. Frontend setup

The widget expects a React project with `socket.io-client` installed:

```bash
cd queue-plugin/frontend
npm install react react-dom socket.io-client
```

Drop `QueuePluginWidget.jsx` into your app, and `App.jsx` shows exactly how
a host site would use it. If you're just testing quickly, wire `App.jsx`
into a fresh Vite/CRA project's entry point.

```bash
npm create vite@latest queue-demo -- --template react
cd queue-demo
npm install socket.io-client
# then copy QueuePluginWidget.jsx and App.jsx into src/, replacing the defaults
npm run dev
```

## 5. Test priority queue-jumping across multiple tabs

This is the key demo moment — proving the min-heap actually reorders live.

1. Open `http://localhost:5173` (or whatever port Vite gives you) in **3
   separate browser tabs**.
2. In **Tab 1**, click "Demo: Hospital Mode", join the queue as "Alice",
   category = `consultation`, urgency = `Routine`.
3. In **Tab 2**, join as "Bob", category = `pharmacy`, urgency = `Routine`.
4. Watch both tabs — each shows its live position and estimated wait.
5. In **Tab 3**, join as "Dan", category = `emergency`, urgency =
   `Emergency`.
6. **Watch Tabs 1 and 2 update instantly** — Dan jumps to position #1, and
   Alice/Bob's positions shift down and their estimated wait times increase.
   This is `recalculate_wait_times()` firing and broadcasting over the
   `queue_update` Socket.IO event to every tab in that tenant's room.
7. On the Staff Dashboard (visible at the top of `App.jsx`'s page), click
   **"Call Next (priority order)"** — it should serve Dan first, since he's
   priority 1, even though he joined last.

## 6. Test bank category-partitioned FIFO

1. Switch to "Demo: Bank Mode".
2. Join as "Eve", category = `cash`.
3. Join as "Frank", category = `loan`.
4. Join as "Grace", category = `cash`.
5. Confirm Grace's estimated wait only accounts for Eve (same category),
   not Frank — categories run as independent FIFO lines.
6. On the Staff Dashboard, click **"Call Next — cash"**: only Eve or Grace
   should be served, never Frank.

## 7. Verifying the backend logic directly (no frontend needed)

If you want to sanity-check the engine without spinning up React at all:

```bash
cd backend
python3 -c "
from queue_engine import engine
engine.join_queue('demo', 'hospital', 'consultation', 'Alice', priority_level=2)
engine.join_queue('demo', 'hospital', 'emergency', 'Dan', priority_level=1)
engine.recalculate_wait_times('demo')
for t in engine.get_queue_snapshot('demo'):
    print(t)
"
```

Dan should print with `position: 1` even though Alice joined first.

## Notes for production hardening (out of scope for the demo, but worth
## knowing before you actually deploy this)

- **Persistence**: `PluginQueueEngine` currently stores everything in memory
  — a server restart wipes all queues. Swap in Redis or Postgres-backed
  storage for real deployments.
- **CORS**: `main.py` currently allows `*`. Restrict `allow_origins` to the
  specific host domains you trust before going live.
- **Auth**: there's no tenant authentication yet — anyone who knows a
  `tenant_id` string can join/serve on it. Add an API key or JWT check per
  tenant for a real multi-tenant SaaS.
- **Model retraining**: `train_model.py` uses synthetic data. In production,
  replace `generate_synthetic_dataset()` with a query against your real
  historical ticket logs, and retrain periodically (e.g. nightly) as more
  real data accumulates.
