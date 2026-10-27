# Cloud-Native AI Agri Marketplace — Project Status

**Phase 1: Environment & Tool Verification, Workspace Initialization**  
**Date:** October 2026  
**Operating System:** Windows 11 (AMD64)  
**Active IDE Workspace:** `c:\Users\srira\Desktop\3-1\CNAD\agri`  
**Referenced Project Path:** `C:\Projects\agri-marketplace`  

---

## 1. Verified Tools & Runtime Status

| Tool | Component | Version | Installation Path | Availability Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Java** | Oracle JDK | 24.0.2 | `C:\Program Files\Java\jdk-24` | **Available** | Verified via `java -version` |
| **Maven** | Apache Maven | 3.10.0 | `C:\Program Files\apache-maven-3.10.0\bin\mvn.cmd` | **Available** | Verified via `mvn -v` |
| **Node.js** | Node Runtime | v22.21.0 | `C:\Program Files\nodejs\node.exe` | **Available** | Verified via `node -v` |
| **npm** | Node Package Mgr | 10.9.4 | `C:\Program Files\nodejs\npm.cmd` | **Available** | Verified via `npm -v` |
| **Git** | Git for Windows | 2.50.1.windows.1 | `C:\Program Files\Git\cmd\git.exe` | **Available** | Verified via `git --version` |
| **MySQL Server** | Windows Service | 8.0 (`MySQL80`) | `C:\Program Files\MySQL\MySQL Server 8.0` | **Available (Service Running)** | Service is active; Port 3306 reachable locally. |
| **MySQL CLI** | Client Executable | 8.0 | `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` | **Requires Configuration** | Installed but **NOT** in system `PATH`. |
| **Docker CLI** | Docker Engine CLI | 29.1.5 | `C:\Program Files\Docker\Docker\resources\bin\docker.exe` | **Available** | CLI binary is accessible. |
| **Docker Desktop**| Daemon / Engine | — | — | **Unavailable (Not Running)** | Daemon pipe not found. Docker Desktop must be launched. |
| **Minikube** | CLI & Orchestrator | v1.38.1 | `C:\minikube\minikube.exe` | **Available (Cluster Stopped)** | CLI available; cluster cannot run without Docker daemon. |
| **kubectl** | K8s CLI | v1.34.1 | `C:\Program Files\Docker\Docker\resources\bin\kubectl.exe` | **Available (Client Only)** | Client ready; no active cluster connected. |
| **Python** | Python Runtime | 3.11.9 | Standard PATH | **Available** | Ready for `ai-service` development. |

---

## 2. Workspace Structure

The project directory structure has been created to support a cloud-native microservices architecture:

```
agri-marketplace/
├── .gitignore          # Multi-stack Git ignore rules (React, Spring Boot, Python, Docker, IDEs, Env)
├── docs/               # Architecture, specification, and project tracking
│   └── PROJECT_STATUS.md
├── frontend/           # React frontend application (SPA / PWA)
│   └── .gitkeep
├── backend/            # Spring Boot REST microservice (Java 24, Maven)
│   └── .gitkeep
├── ai-service/         # Python AI / ML service (Recommendation & Pricing models)
│   └── .gitkeep
└── deployment/         # Dockerfiles, docker-compose.yml, Kubernetes (Minikube) manifests
    └── .gitkeep
```

---

## 3. Verification Findings & Prerequisites for Next Phase

1. **Docker Desktop**:
   - Docker CLI is installed, but the daemon is not running (`dockerDesktopLinuxEngine` named pipe missing).
   - **Action needed**: Launch the Docker Desktop desktop app from the Windows Start menu.
2. **Minikube**:
   - Minikube binary is verified (`v1.38.1`). Because it targets the Docker driver, it requires Docker Desktop to be running before executing `minikube start`.
3. **MySQL Database**:
   - The Windows Service `MySQL80` is running and accepting TCP connections on port 3306.
   - For command line convenience, add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to the user's system `PATH`.
   - The database for the application (`agri_marketplace`) can be created once credentials are confirmed.

---

## 4. Next Implementation Milestone: Milestone 2

- **Milestone 2 Objective:** Backend Initialization & Database Schema
  - Initialize Spring Boot 3.x project skeleton inside `backend/` using Maven.
  - Configure `application.yml` for MySQL datasource.
  - Define initial entity models, JPA repositories, and test database connectivity.
