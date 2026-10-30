# AI Service - Cloud-Native AI Agri Marketplace

Python 3.11 FastAPI microservice delivering explainable crop demand forecasting, dynamic pricing recommendations, and farmer profit intelligence.

---

## Capabilities & Architecture

- **Demand Forecasting (`POST /api/forecast/demand`)**:
  - Aggregates historical customer transactions by chronological interval (daily).
  - Automatically zero-fills missing dates to prevent artificial compression.
  - Prevents data leakage using chronological train/test splits (80% train / 20% test).
  - Evaluates Ridge autoregressive lag regression against a Naive Persistence Baseline.
  - Calculates and returns empirical MAE and RMSE metrics.
  - Transparently identifies insufficient historical sample size (< 5 points) and flags `status: "INSUFFICIENT_DATA"` with a fallback average instead of pretending an ML model is statistically reliable.
  
- **Dynamic Pricing Recommendations (`POST /api/pricing/recommend`)**:
  - Produces farmer-facing recommended price bands and suggested rates.
  - Evaluates inventory pressure (stock vs demand velocity), farmer production cost floor, and demand forecast trajectory.
  - Clearly categorized as `EXPLAINABLE_RULE_ENGINE` or `HYBRID_ML_RULE`.
  - Non-destructive and informational: requires farmer approval; prices are never modified automatically.

- **Profit Intelligence (`POST /api/profit/analyze`)**:
  - Computes gross revenue from verified customer orders.
  - Calculates net profit and margins **strictly** when farmer supplies verified cost per kg.
  - Never fabricates or infers production costs from sales revenue.
  - Clearly reports profit as unavailable if cost data is omitted.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status (`UP`) and version |
| `POST` | `/api/forecast/demand` | Demand forecasting with baseline metrics & data guardrails |
| `POST` | `/api/pricing/recommend` | Dynamic pricing recommendation with factor explanations |
| `POST` | `/api/profit/analyze` | Gross revenue, verified cost, and profit analysis |

---

## Local Setup & Execution

### 1. Requirements
- Python 3.11.x
- pip

### 2. Installation
```powershell
cd ai-service
python -m pip install -r requirements.txt
```

### 3. Running Automated Tests
```powershell
python -m pytest
```

### 4. Starting the Service
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## 5. Containerization & Cloud-Native Deployment (Phase 7)

The AI service uses an optimized production `Dockerfile`:
- **Base Image:** `python:3.11-slim-bookworm`.
- **Security:** Creates and runs as unprivileged user `appuser:appuser` (`UID 10001`, `GID 10001`). Root access is dropped.
- **Python Optimization:** Configured with `PYTHONDONTWRITEBYTECODE=1` and `PYTHONUNBUFFERED=1`.
- **Health Check:** Periodic `curl -f http://localhost:8000/health` probe every 30s.
- **Dependency Isolation:** System build tools (`build-essential`) are purged after wheel installation to minimize final image footprint and attack surface.

### Building the AI Service Docker Image
```powershell
docker build -t agri-ai-service:1.0.0 ./ai-service
```

### Running the AI Service Container Standalone
```powershell
docker run -d `
  --name agri-ai-service `
  -p 8000:8000 `
  agri-ai-service:1.0.0
```

