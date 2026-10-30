# Cloud-Native AI Agri Marketplace

A full-stack, cloud-native agricultural e-commerce platform connecting farmers directly with retail and commercial produce buyers. Features role-based access control, atomic shopping cart and order lifecycle management, machine learning demand forecasting, dynamic pricing intelligence, containerized microservices, Kubernetes manifests, Helm packaging, and GitHub Actions CI/CD pipelines.

---

## 1. System Architecture

```
                    ┌────────────────────────────────────────┐
                    │               Web Browser              │
                    │         http://localhost:3000          │
                    └───────────────────┬────────────────────┘
                                        │ HTTP
                                        ▼
                    ┌────────────────────────────────────────┐
                    │       Frontend (Nginx 1.27 + React 18) │
                    │       Port 80 / NodePort 30080         │
                    └───────────────────┬────────────────────┘
                                        │ /api/ reverse proxy
                                        ▼
                    ┌────────────────────────────────────────┐
                    │  Backend (Spring Boot 3.5.9 + Java 21) │
                    │               Port 8080                │
                    └───────────┬────────────────┬───────────┘
                                │                │
              JDBC (Port 3306)  │                │ HTTP REST (Port 8000)
                                ▼                ▼
┌─────────────────────────────────┐   ┌───────────────────────────────────┐
│     MySQL 8.0 Database          │   │  AI Service (Python 3.11 FastAPI) │
│     (agri_marketplace)          │   │  - Autoregressive Ridge Forecast  │
│     InnoDB Persistent Storage   │   │  - Dynamic Pricing Engine         │
└─────────────────────────────────┘   │  - Profit Margin Intelligence     │
                                      └───────────────────────────────────┘
```

### Components Summary

| Component | Technology Stack | Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, Axios, Lucide Icons | `3000` (Docker) / `5173` (Dev) | Catalog browsing, customer cart, atomic checkout, tracking, farmer listings, AI forecasting chart & profit analytics dashboard. |
| **Backend** | Spring Boot 3.5.9, Java 21, Spring Security, Spring Data JPA | `8080` | REST API, role-based authorization, HttpOnly sessions, CSRF protection, pessimistic stock locking (`SELECT ... FOR UPDATE`), Actuator health. |
| **AI Service** | Python 3.11, FastAPI, Pydantic, Scikit-learn, Pandas | `8000` | Explainable demand forecasting against persistence baselines, dynamic price recommendation with cost-floor protection, verified profit analytics. |
| **Database** | MySQL 8.0 | `3306` (Internal) / `3307` (Local host) | Persistent relational store for users, crops, carts, orders, and order item historical snapshots. Isolated from external access. |

---

## 2. Platform Capabilities by Phase

- **Phase 1 (Foundation):** Clean multi-service directory structure, Git configuration, and tool availability baseline.
- **Phase 2 (Spring Boot Backend):** REST APIs for crop inventory (`/api/crops`), Spring Data JPA, and MySQL persistence.
- **Phase 3 (React Frontend):** Modern, responsive marketplace UI with search, filtering, and live backend telemetry.
- **Phase 4 (Security & RBAC):** Server-managed HttpOnly sessions (`JSESSIONID`), BCrypt password hashing, CSRF tokens (`X-XSRF-TOKEN`), and roles: `CUSTOMER`, `FARMER`, `ADMIN`.
- **Phase 5 (Cart & Order Management):** Real-time shopping cart (`/api/cart`), atomic checkout with pessimistic concurrency locking, historical price snapshots, and fulfillment lifecycle (`PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED`).
- **Phase 6 (AI Intelligence):** FastAPI microservice delivering explainable autoregressive demand forecasting, benchmarked against naive persistence baselines, data sparsity guardrails, dynamic pricing recommendations, and verified profit margins.
- **Phase 7 (Cloud-Native Deployment):** Production multi-stage Dockerfiles (non-root UIDs), Docker Compose with health checks, Kubernetes manifests (`deployment/k8s/`), Helm chart (`deployment/helm/agri-marketplace/`), and GitHub Actions CI/CD workflows (`.github/workflows/`).
- **Phase 8 (Multilingual Support & Localization):** Complete internationalization supporting English (`en`), Telugu (`te`), and Hindi (`hi`). Features instant language switching without page reloads or cart loss, Unicode typography (Noto Sans Telugu & Noto Sans Devanagari), `localStorage` persistence, accessible language selectors, and locale-aware number, date, and currency (`₹`) formatting (`en-IN`, `te-IN`, `hi-IN`).

---

## 3. Local Development (Running Natively on Windows)

### Prerequisites
- Java 21 LTS (`jdk-21.0.12.1`)
- Apache Maven 3.10.0+
- Node.js 20+ or 22+ & npm
- Python 3.11.x
- MySQL Server 8.0 running locally on port 3306 with database `agri_marketplace`

### Starting All Services (PowerShell)

#### Terminal 1: AI Service
```powershell
cd C:\Users\srira\Desktop\3-1\CNAD\agri\ai-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Terminal 2: Spring Boot Backend
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12.1"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd C:\Users\srira\Desktop\3-1\CNAD\agri\backend

$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "<YOUR_MYSQL_PASSWORD>"
$env:AI_SERVICE_URL = "http://localhost:8000"

mvn spring-boot:run
```

#### Terminal 3: React Frontend
```powershell
cd C:\Users\srira\Desktop\3-1\CNAD\agri\frontend
npm install
npm run dev
```

Browse to: **`http://localhost:5173`**

---

## 4. Multi-Container Deployment via Docker Compose

### Step 1: Copy Environment Template
```powershell
cd C:\Users\srira\Desktop\3-1\CNAD\agri
Copy-Item .env.example .env
```

### Step 2: Validate Configuration
```powershell
docker compose --env-file .env config
```

### Step 3: Launch Stack
```powershell
docker compose --env-file .env up --build -d
```

### Step 4: Verify Health Status
```powershell
docker compose ps
```
- Frontend: `http://localhost:3000`
- Backend Actuator: `http://localhost:8080/actuator/health`
- AI Service Health: `http://localhost:8000/health`
- MySQL: internal `3306`, bound to `127.0.0.1:3307` on host

---

## 5. Kubernetes & Helm Deployment (Minikube)

For detailed deployment procedures, consult [`deployment/README.md`](deployment/README.md).

### Quick Start with Minikube

```powershell
# 1. Start Minikube
minikube start --driver=docker --cpus=4 --memory=8192

# 2. Build and Load Images
docker build -t agri-backend:1.0.0 ./backend
docker build -t agri-ai-service:1.0.0 ./ai-service
docker build -t agri-frontend:1.0.0 ./frontend

minikube image load agri-backend:1.0.0
minikube image load agri-ai-service:1.0.0
minikube image load agri-frontend:1.0.0

# 3. Deploy via Helm
helm install agri-marketplace ./deployment/helm/agri-marketplace `
  --namespace agri-marketplace `
  --create-namespace `
  -f ./deployment/helm/agri-marketplace/values-local.yaml

# 4. Access Frontend
minikube service agri-frontend -n agri-marketplace
```

---

## 6. Automated Testing & Verification

Automated tests can be executed independently across all tiers:

```powershell
# 1. Python AI Service Tests (11 passed)
cd C:\Users\srira\Desktop\3-1\CNAD\agri\ai-service
python -m pytest

# 2. Frontend Vitest Tests (21 passed across 4 test suites)
cd C:\Users\srira\Desktop\3-1\CNAD\agri\frontend
npm test -- --run

# 3. Frontend Production Build
npm run build

# 4. Backend Spring Boot Tests (59 passed)
cd C:\Users\srira\Desktop\3-1\CNAD\agri\backend
mvn clean test

# 5. Helm Chart Linting & Template Validation (0 errors)
cd C:\Users\srira\Desktop\3-1\CNAD\agri
helm lint deployment/helm/agri-marketplace
helm template test-rel deployment/helm/agri-marketplace -f deployment/helm/agri-marketplace/values-local.yaml

# 6. Kubernetes Kustomize Manifest Validation
kubectl kustomize deployment/k8s
```

---

## 7. Security & Compliance Checklist

- [x] **No Root Containers:** Backend and AI services run under dedicated unprivileged system users (`UID 10001`).
- [x] **Database Isolation:** MySQL service is `ClusterIP` in Kubernetes and bound strictly to `127.0.0.1:3307` in Docker Compose.
- [x] **Credential Segregation:** No production credentials committed to Git; environment variables and Kubernetes secrets used exclusively.
- [x] **Stateful Sessions:** HttpOnly cookies prevent XSS theft of session IDs.
- [x] **CSRF Mitigation:** Double-submit cookie pattern with `X-XSRF-TOKEN` header validation on mutating HTTP verbs.
- [x] **Concurrency & Race Conditions:** Pessimistic write locks (`SELECT ... FOR UPDATE`) prevent inventory overselling.
- [x] **Data Privacy & AI Guardrails:** Producer order isolation prevents unauthorized cross-tenant data access; zero-fill and persistence baselines prevent statistical distortion in AI forecasting.
