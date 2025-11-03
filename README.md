## EcoSap Monorepo

EcoSap is a monorepo containing:

- `Ecosap/ecosap/`: TypeScript/Node backend (REST API)
- `Ecosap/ecosap_fe/sapling-earns-shop/`: React + Vite frontend (TypeScript)
- `Ecosap/Yolo_model/`: Python service for tree crown segmentation (YOLO)

### Repository Structure

```
Ecosap/
  ecosap/                     # Backend API (TypeScript/Node)
  ecosap_fe/
    sapling-earns-shop/       # Frontend app (Vite + React)
  Yolo_model/                 # ML microservice (Python)
```

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Git

Optional (recommended):
- `pnpm` or `yarn`

---

## Backend (Node + TypeScript)

Location: `Ecosap/ecosap/`

### Install

```bash
cd Ecosap/ecosap
npm install
```

### Environment

Create `.env` (if needed) alongside `package.json` and add values used by the server (DB connection, JWT secret, etc.). Common variables:

```
PORT=3000
DATABASE_URL=...
JWT_SECRET=...
```

### Run

```bash
npm run dev       # start in dev mode (ts-node / nodemon)
# or
npm run build && npm run start
```

API entrypoints:
- Main: `Ecosap/ecosap/index.ts` and `Ecosap/ecosap/app.ts`
- Routers: `Ecosap/ecosap/router/v1/`
- Models: `Ecosap/ecosap/models/`

---

## Frontend (React + Vite)

Location: `Ecosap/ecosap_fe/sapling-earns-shop/`

### Install

```bash
cd Ecosap/ecosap_fe/sapling-earns-shop
npm install
```

### Run

```bash
npm run dev      # launches Vite dev server
```

Configure API base URL (if applicable) in your frontend environment or config files so it can reach the backend.

---

## YOLO Model Service (Python)

Location: `Ecosap/Yolo_model/`

### Setup

```bash
cd Ecosap/Yolo_model
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

### Run

The repository includes `api/area.py` and `render.yaml` for deployment. If a local API server is provided (e.g., FastAPI/uvicorn), run it similar to:

```bash
uvicorn api.area:app --host 0.0.0.0 --port 8001 --reload
```

Adjust command based on the actual app object/module if different.

---

### Model Details

- Framework: Ultralytics YOLO (segmentation)
- Task: Instance segmentation of tree crowns (outputs binary masks per detection)
- Weights: `Ecosap/Yolo_model/runs/segment/tree_crowns/weights/best.pt`
- Default inference settings (see `api/area.py`):
  - `imgsz=1024`
  - `conf=0.25`
  - Endpoint accepts `gsd` (ground sample distance, meters/pixel) to convert pixel area to square meters

Environment overrides:
- Set `MODEL_PATH` to use a different weights file at runtime.

Artifacts and metrics:
- Training outputs: `Ecosap/Yolo_model/runs/segment/tree_crowns/`
  - Curves/plots: `results.png`, `confusion_matrix*.png`, `*curve.png`
  - Tabular metrics: `results.csv`

Sample request:

```bash
curl -X POST \
  -F "file=@/path/to/image.jpg" \
  -F "gsd=0.45" \
  http://localhost:8001/area
```

Reproduce training (template):

```bash
# Example using Ultralytics CLI (adjust dataset yaml and model size)
yolo task=segment mode=train \
  model=yolov8n-seg.pt \
  data=/path/to/data.yaml \
  imgsz=1024 epochs=100 batch=8 device=0
```

Evaluate/export (template):

```bash
# Validate
yolo task=segment mode=val model=/path/to/best.pt data=/path/to/data.yaml imgsz=1024

# Export to ONNX (example)
yolo mode=export model=/path/to/best.pt format=onnx opset=13
```

---

## Credits Calculation

Credits are awarded based on the segmented tree crown area returned by the ML service and adjusted by image quality and optional domain factors.

Formula (from backend sapling route):
- Base credits from total area in m² using tiered, diminishing returns:
  - 0–10 m²: area × 10
  - 10–50 m²: 100 + (area − 10) × 8
  - 50–100 m²: 420 + (area − 50) × 6
  - 100–500 m²: 720 + (area − 100) × 4
  - 500–1000 m²: 2320 + (area − 500) × 2
  - >1000 m²: 3320 + log10(area − 999) × 500
- GSD quality multiplier (if provided):
  - gsd ≤ 0.5 → ×1.5, ≤1.0 → ×1.3, ≤2.0 → ×1.15, ≤5.0 → ×1.0, else ×0.8
- Optional domain multipliers (if supplied):
  - vegetationDensity bonus: ×(1 + density × 0.5)
  - growth bonus vs previousArea: up to ×1.3; shrinkage beyond 20%: ×0.7
  - species multiplier: e.g., oak ×1.3, mangrove ×1.5, default ×1.0
  - locationMultiplier: direct multiplier
- Final credits: floor of adjusted credits, with a minimum of 1

Inputs used:
- From ML: `total_area_m2`, `trees[]`
- From request: `gsd` (meters/pixel)
- Optional: previous measurements, species, location factor

### System Flow

```mermaid
flowchart TD
  A[User uploads image + GSD] --> B[Frontend /upload]
  B --> C[Backend /v1/sapling (auth)]
  C --> D[Python ML /area]
  D -->|total_area_m2, trees[]| C
  C --> E[calculateCredits(area, gsd, factors)]
  E --> F[MongoDB: increment user.ecocredits]
  F --> G[Response: success, area, creditsAdded, totalCredits]
```

---

## Free Deployment Guide

Deploy all services on free tiers:

1) Database (MongoDB Atlas — Free)
- Create an Atlas account and an M0 free cluster
- Create a DB user and get the connection string
- Set backend `DB_CONN_STRING`

2) ML Service (Render — Free Web Service)
- Service root: `Ecosap/Yolo_model/`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn api.area:app --host 0.0.0.0 --port $PORT`
- Env vars: `MODEL_PATH=api/runs/segment/tree_crowns/weights/best.pt`
- Note: Free tier sleeps when idle; expect cold starts

Alternatives: Fly.io free allocation, Railway free tier

3) Backend API (Vercel — Free)
- Project root: `Ecosap/ecosap/` (contains `vercel.json`)
- Env vars:
  - `AREA_SERVICE_URL` = Render ML URL, e.g., `https://your-ml.onrender.com/area`
  - `DB_CONN_STRING` = MongoDB Atlas URI
  - `JWT_SECRET` = a strong random secret

Alternative: Render Free Web Service for a persistent Express server

4) Frontend (Vercel — Free)
- Project root: `Ecosap/ecosap_fe/sapling-earns-shop/`
- Env var: `VITE_API_BASE_URL` = your backend URL (e.g., `https://your-api.vercel.app`)
- Build: `npm run build`  Output: `dist`

Post-deploy checks
- ML: visit `/health` to confirm model loads
- Backend: check base/health endpoint
- Frontend: upload an image and verify credits update

Cost notes: All suggested platforms have free tiers; usage limits and sleep/cold starts apply

---

## Development Notes

- TypeScript config: `Ecosap/ecosap/tsconfig.json`
- Frontend tooling: Tailwind, shadcn UI components, Vite
- Deployment configs: `Ecosap/ecosap/vercel.json`, frontend `vercel.json`, ML `render.yaml`

---

## Common Scripts

Backend (in `Ecosap/ecosap/`):
- `npm run dev` — start dev server
- `npm run build` — compile TypeScript
- `npm run start` — run compiled server

Frontend (in `Ecosap/ecosap_fe/sapling-earns-shop/`):
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build

---

## Licensing

Add your preferred license here (e.g., MIT) or link to `LICENSE` if present.

---

## Contributing

1. Create a feature branch
2. Commit with clear messages
3. Open a PR describing the change and testing steps


