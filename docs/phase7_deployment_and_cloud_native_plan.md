# Phase 7 Implementation Plan: Docker, Kubernetes, Helm, CI/CD & Cloud-Native Deployment

## 1. Executive Summary & Baseline Results

The Cloud-Native AI Agri Marketplace has achieved full functional and algorithmic maturity across Phases 1–6:
- **Backend**: Spring Boot 3.5.9 on Java 21, Spring Security, MySQL 8, JPA pessimistic write locking.
- **Frontend**: React 18, Vite 6, Tailwind CSS, Axios, React Router.
- **AI Service**: Python 3.11, FastAPI, Pandas, NumPy, Scikit-learn.
- **Baseline Test Pass Rate**:
  - Python Pytest: **11 passed in 3.38s** (0 failures).
  - Backend Maven: **59 passed in 1m 26s** (0 failures, 0 errors).
  - Frontend Vitest: **11 passed in 5.15s** (0 failures).
  - Frontend Production Build: **4.91s** clean bundle.

---

## 2. Containerization Architecture

```
                                  [ Browser / Client ]
                                            │
                                            ▼
                           ┌──────────────────────────────────┐
                           │   Frontend Container (Nginx)     │
                           │         Port: 80 / 5173          │
                           │   - Serves React SPA static files │
                           │   - Proxies /api/* to Backend    │
                           └─────────────────┬────────────────┘
                                             │ HTTP /api/*
                                             ▼
                           ┌──────────────────────────────────┐
                           │   Backend Container (Java 21)    │
                           │            Port: 8080            │
                           │   - Spring Boot Application      │
                           │   - Actuator Health Probes       │
                           └───┬───────────────────────────┬──┘
                               │ MySQL Protocol (3306)     │ HTTP REST
                               ▼                           ▼
            ┌──────────────────────────────┐   ┌──────────────────────────────┐
            │   MySQL Container (8.0)      │   │   AI Microservice (Py 3.11)  │
            │   Port: 3306 (Internal only) │   │   Port: 8000                 │
            │   Named Volume: mysql_data   │   │   FastAPI /health Probe      │
            └──────────────────────────────┘   └──────────────────────────────┘
```

### Container Design Specifications
1. **Frontend (`frontend/Dockerfile`)**:
   - **Stage 1 (Builder)**: `node:22-alpine` runs `npm ci` and `npm run build`.
   - **Stage 2 (Runtime)**: `nginx:1.27-alpine` non-root image.
   - Custom `nginx.conf`:
     - SPA routing fallback: `try_files $uri $uri/ /index.html;`
     - Reverse proxy: `/api/` passes to `http://backend:8080/api/`
     - Security headers: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`.
   - Healthcheck: `wget -qO- http://localhost:80/ || exit 1`.
2. **Backend (`backend/Dockerfile`)**:
   - **Stage 1 (Builder)**: `maven:3.9.9-eclipse-temurin-21-alpine` runs `mvn clean package -DskipTests`.
   - **Stage 2 (Runtime)**: `eclipse-temurin:21-jre-alpine` lightweight JRE.
   - Creates unprivileged system user `spring:spring` (UID 10001).
   - Healthcheck: `wget -qO- http://localhost:8080/actuator/health || exit 1`.
   - Memory optimization: `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`.
3. **AI Service (`ai-service/Dockerfile`)**:
   - Base: `python:3.11-slim-bookworm`.
   - Creates unprivileged system user `appuser:appuser` (UID 10001).
   - Installs requirements without cache (`--no-cache-dir`).
   - Runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
   - Healthcheck: Python-based or curl check to `http://localhost:8000/health`.
4. **Local Docker Compose (`compose.yaml`)**:
   - Services: `mysql`, `ai-service`, `backend`, `frontend`.
   - MySQL service includes `test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]` healthcheck.
   - Strict `depends_on: { service: { condition: service_healthy } }`.
   - Persistent volume `mysql_data`.
   - Parameterized via `.env` with a clean `.env.example`.

---

## 3. Kubernetes Deployment Architecture (`deployment/k8s/`)

- **Namespace**: `agri-marketplace`
- **ConfigMaps**: Application settings, service URLs (`AI_SERVICE_URL=http://ai-service:8000`, DB connection string).
- **Secrets**: Database credentials, hashed secrets (provided via template `secrets.yaml.example`).
- **Storage**: PersistentVolumeClaim `mysql-pvc` with 5Gi capacity.
- **Probes**:
  - `backend`: Liveness `/actuator/health/liveness`, Readiness `/actuator/health/readiness`.
  - `ai-service`: Liveness `/health`, Readiness `/health`.
  - `frontend`: Liveness `/`, Readiness `/`.
  - `mysql`: Exec `mysqladmin ping`.
- **Resource Constraints**:
  - Backend: Requests 250m CPU / 512Mi RAM, Limits 1000m CPU / 1024Mi RAM.
  - AI Service: Requests 150m CPU / 256Mi RAM, Limits 500m CPU / 512Mi RAM.
  - Frontend: Requests 50m CPU / 64Mi RAM, Limits 200m CPU / 128Mi RAM.

---

## 4. Helm Chart Architecture (`deployment/helm/agri-marketplace/`)

- Standard Helm 3 structure:
  ```
  deployment/helm/agri-marketplace/
  ├── Chart.yaml
  ├── values.yaml            # Default values (production-ready structure)
  ├── values-local.yaml      # Values for Minikube local demo
  └── templates/
      ├── _helpers.tpl
      ├── namespace.yaml
      ├── configmap.yaml
      ├── secret.yaml
      ├── pvc-mysql.yaml
      ├── deployment-mysql.yaml
      ├── service-mysql.yaml
      ├── deployment-backend.yaml
      ├── service-backend.yaml
      ├── deployment-ai.yaml
      ├── service-ai.yaml
      ├── deployment-frontend.yaml
      └── service-frontend.yaml
  ```
- Validation with `helm lint` and `helm template`.

---

## 5. CI/CD Workflows (`.github/workflows/`)

1. **`ci.yaml` (Pull Request & Push to Main)**:
   - **Job 1**: Backend Maven test (`eclipse-temurin:21`).
   - **Job 2**: Python AI Service test (`python:3.11`).
   - **Job 3**: Frontend Vitest test + Production Build (`node:22`).
   - **Job 4**: Kubernetes & Helm Linting (validates Helm chart rendering and templates).
   - **Job 5**: Dockerfile build dry-run (verifies Dockerfiles compile without errors).
2. **`release.yaml` (Tag-triggered Image Publication)**:
   - Uses GitHub Actions secrets `DOCKER_USERNAME` / `DOCKER_PASSWORD` or GHCR `GITHUB_TOKEN`.
   - Multi-arch image build and push.

---

## 6. Execution & Verification Steps

1. Create all `.dockerignore` files.
2. Create Dockerfiles for `frontend`, `backend`, `ai-service`.
3. Create `compose.yaml` and `.env.example`.
4. Create Kubernetes manifests in `deployment/k8s/`.
5. Create Helm chart in `deployment/helm/agri-marketplace/`.
6. Run `helm lint` and `helm template` tests.
7. Create `.github/workflows/ci.yaml` and `.github/workflows/release.yaml`.
8. Update all documentation (`README.md`, `docs/PROJECT_STATUS.md`, etc.).
9. Report exact runtime availability and provide copy-paste PowerShell instructions.
