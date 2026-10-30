# Cloud-Native AI Agri Marketplace - Deployment Guide

This directory contains cloud-native deployment configurations for the Cloud-Native AI Agri Marketplace, including Docker Compose, raw Kubernetes manifests, and a Helm chart.

---

## 1. Architecture & Deployment Options

The system consists of four primary containerized components:
1. **Frontend**: React 18 + Vite SPA served via Nginx 1.27 Alpine (port `80` container, exposed as `3000` locally or NodePort `30080` in Kubernetes). Proxies `/api/` directly to the Spring Boot backend.
2. **Backend**: Spring Boot 3.5.9 on Eclipse Temurin Java 21 Alpine (port `8080`). Connects to MySQL (`3306`) and AI service (`8000`). Runs under unprivileged user `spring:spring` (UID 10001).
3. **AI Service**: Python 3.11 FastAPI microservice (port `8000`). Exposes `/health`, `/api/ai/forecast`, `/api/ai/pricing-recommendations`, and `/api/ai/profit-intelligence`. Runs under unprivileged user `appuser` (UID 10001).
4. **Database**: MySQL 8.0 with InnoDB persistent storage. Accessible only internally within Docker/Kubernetes networks (or on `127.0.0.1:3307` for local administration; never exposed publicly).

| Component | Image Name | Container Port | Health Check / Probe | Security Context |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `agri-frontend:1.0.0` | `80` | `GET /` | Non-root Nginx |
| **Backend** | `agri-backend:1.0.0` | `8080` | `GET /actuator/health` | Non-root `UID 10001` |
| **AI Service** | `agri-ai-service:1.0.0` | `8000` | `GET /health` | Non-root `UID 10001` |
| **MySQL** | `mysql:8.0` | `3306` | `mysqladmin ping -h 127.0.0.1` | Non-root `UID 999` |

---

## 2. Docker Compose (Local Multi-Container Deployment)

The root `compose.yaml` file configures the entire stack with strict dependency health checks, persistent volumes, and isolated networking.

### Prerequisites
- Docker Engine & Docker Compose installed.
- Ensure ports `3000`, `8080`, `8000`, and `3307` are free on `localhost`.

### Step 1: Environment File Setup
Create a local `.env` file from `.env.example`:
```powershell
Copy-Item .env.example .env
```
*(The `.env` file is ignored by Git to prevent credential leaks. You may adjust passwords or keep local demo defaults.)*

### Step 2: Validate Compose Configuration
```powershell
docker compose --env-file .env config
```

### Step 3: Build and Start Containers
```powershell
docker compose --env-file .env up --build -d
```

### Step 4: Verify Status and Health
```powershell
docker compose ps
docker compose logs -f backend
```

All four services will transition to `healthy`:
- Frontend: `http://localhost:3000`
- Backend API & Actuator: `http://localhost:8080/actuator/health`
- AI Service Health: `http://localhost:8000/health`
- MySQL: internal `agri-mysql:3306` (or `127.0.0.1:3307` for host DB tools)

### Step 5: Teardown
```powershell
# Stop services while preserving database volume:
docker compose down

# Stop services and remove database volume:
docker compose down -v
```

---

## 3. Kubernetes Manifests (`deployment/k8s/`)

Plain Kubernetes manifests are organized under `deployment/k8s/` and managed with Kustomize.

### Directory Structure
```
deployment/k8s/
├── namespace.yaml             # Creates 'agri-marketplace' namespace
├── configmap.yaml             # Non-sensitive environment variables
├── secrets.yaml.example       # Template for database & session secrets
├── pvc-mysql.yaml             # PersistentVolumeClaim (5Gi) for MySQL
├── mysql.yaml                 # Deployment & ClusterIP Service for MySQL
├── ai-service.yaml            # Deployment & ClusterIP Service for FastAPI
├── backend.yaml               # Deployment & ClusterIP Service for Spring Boot
├── frontend.yaml              # Deployment & NodePort (30080) Service
└── kustomization.yaml         # Kustomize manifest list
```

### Minikube Deployment Instructions

#### 1. Start Minikube
```powershell
minikube start --driver=docker --cpus=4 --memory=8192
```

#### 2. Build Container Images Locally
```powershell
docker build -t agri-backend:1.0.0 ./backend
docker build -t agri-ai-service:1.0.0 ./ai-service
docker build -t agri-frontend:1.0.0 ./frontend
```

#### 3. Load Images into Minikube
```powershell
minikube image load agri-backend:1.0.0
minikube image load agri-ai-service:1.0.0
minikube image load agri-frontend:1.0.0
```

#### 4. Prepare Secrets
Copy `secrets.yaml.example` to `secrets.yaml`:
```powershell
Copy-Item deployment/k8s/secrets.yaml.example deployment/k8s/secrets.yaml
```
*(Optionally encode your custom passwords in base64. `secrets.yaml` is ignored in `.gitignore`.)*

#### 5. Apply Kubernetes Manifests
```powershell
kubectl apply -k deployment/k8s
```

#### 6. Verify Rollout Status
```powershell
kubectl get pods -n agri-marketplace
kubectl rollout status deployment/agri-mysql -n agri-marketplace
kubectl rollout status deployment/agri-ai-service -n agri-marketplace
kubectl rollout status deployment/agri-backend -n agri-marketplace
kubectl rollout status deployment/agri-frontend -n agri-marketplace
```

#### 7. Access Applications via Minikube
```powershell
# Option A: Minikube Service URL
minikube service agri-frontend -n agri-marketplace

# Option B: Port Forwarding
kubectl port-forward svc/agri-frontend 3000:80 -n agri-marketplace
```

#### 8. Cleanup
```powershell
kubectl delete -k deployment/k8s
```

---

## 4. Helm Chart (`deployment/helm/agri-marketplace/`)

A production-ready Helm chart is provided for templated, parameter-driven deployments across different environments (local development, staging, production).

### Chart Structure
```
deployment/helm/agri-marketplace/
├── Chart.yaml                 # Metadata (chart v0.1.0, app v1.0.0)
├── values.yaml                # Default values (image tags, resources, probes)
├── values-local.yaml          # Overrides for local Minikube demo
└── templates/
    ├── _helpers.tpl           # Template naming & label helpers
    ├── configmap.yaml         # Environment ConfigMap
    ├── secret.yaml            # Environment Secrets
    ├── pvc-mysql.yaml         # MySQL PVC
    ├── deployment-mysql.yaml  # MySQL Deployment
    ├── service-mysql.yaml     # MySQL ClusterIP Service
    ├── deployment-ai.yaml     # AI Service Deployment
    ├── service-ai.yaml        # AI Service ClusterIP Service
    ├── deployment-backend.yaml# Spring Boot Deployment
    ├── service-backend.yaml   # Spring Boot ClusterIP Service
    ├── deployment-frontend.yaml # Frontend Deployment
    └── service-frontend.yaml  # Frontend NodePort/ClusterIP Service
```

### Helm Verification & Linting

#### 1. Lint the Chart
```powershell
helm lint deployment/helm/agri-marketplace
```
*Expected: `1 chart(s) linted, 0 chart(s) failed`.*

#### 2. Test Template Rendering
```powershell
helm template agri-marketplace deployment/helm/agri-marketplace -f deployment/helm/agri-marketplace/values-local.yaml
```

#### 3. Install on Minikube
```powershell
helm install agri-marketplace deployment/helm/agri-marketplace `
  --namespace agri-marketplace `
  --create-namespace `
  -f deployment/helm/agri-marketplace/values-local.yaml
```

#### 4. Upgrade / Reconfigure
```powershell
helm upgrade agri-marketplace deployment/helm/agri-marketplace `
  --namespace agri-marketplace `
  -f deployment/helm/agri-marketplace/values-local.yaml
```

#### 5. Uninstall
```powershell
helm uninstall agri-marketplace --namespace agri-marketplace
```

---

## 5. Security & Isolation Highlights

1. **Non-Root Execution**:
   - Backend runs as `UID 10001` (`spring:spring`).
   - AI service runs as `UID 10001` (`appuser:appuser`).
   - Security contexts enforce `runAsNonRoot: true` in Kubernetes manifests.
2. **Database Isolation**:
   - In Kubernetes, MySQL Service is type `ClusterIP` on port `3306`. It cannot be reached from outside the cluster.
   - In Docker Compose, MySQL port is bound strictly to loopback (`127.0.0.1:3307`).
3. **Secret Separation**:
   - No production passwords or API tokens are stored in Git.
   - All deployments consume secrets via Kubernetes Secrets or Docker Compose environment variables.
4. **CORS & CSRF**:
   - Frontend accesses the backend through the Nginx reverse proxy `/api/` prefix, mitigating cross-origin complications and protecting CSRF tokens in HttpOnly session cookies.

---

## 6. Observability & Troubleshooting

### Health Check Endpoints
- **Frontend**: Nginx root test `GET /` (HTTP 200).
- **Backend**: Spring Boot Actuator `GET /actuator/health` (HTTP 200 `{"status":"UP"}`).
- **AI Service**: FastAPI `GET /health` (HTTP 200 `{"status":"healthy","model_loaded":true}`).
- **MySQL**: `mysqladmin ping -h 127.0.0.1` (Returns 0).

### Diagnostic Commands

#### Check Pod Events and Status
```powershell
kubectl get pods -n agri-marketplace -o wide
kubectl describe pod <pod-name> -n agri-marketplace
```

#### View Application Logs
```powershell
# Backend logs
kubectl logs -f -l app.kubernetes.io/component=backend -n agri-marketplace

# AI service logs
kubectl logs -f -l app.kubernetes.io/component=ai-service -n agri-marketplace

# Frontend access logs
kubectl logs -f -l app.kubernetes.io/component=frontend -n agri-marketplace

# MySQL logs
kubectl logs -f -l app.kubernetes.io/component=database -n agri-marketplace
```

#### Common Issues & Remedies

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `ErrImageNeverPull` / `ImagePullBackOff` | Images not loaded into Minikube | Run `minikube image load <image-name>:<tag>`. Verify `imagePullPolicy: IfNotPresent` or `Never`. |
| Backend pod in `CrashLoopBackOff` | MySQL is not ready or wrong password | Verify MySQL pod is running and healthy. Check Secret values match between MySQL and Backend. |
| AI forecasts return fallback or error | AI service is starting or unreachable | Verify `AI_SERVICE_URL` in backend points to `http://agri-ai-service:8000`. Spring Boot falls back gracefully to deterministic rule-based predictions if AI service is temporarily offline. |
| Browser cannot access frontend | NodePort or port-forward not active | Run `minikube service agri-frontend -n agri-marketplace` or `kubectl port-forward svc/agri-frontend 3000:80 -n agri-marketplace`. |
