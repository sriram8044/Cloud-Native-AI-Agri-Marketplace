# Cloud-Native AI Agri Marketplace — Project Status

**Phases 1, 2, 3, 4, 5, 6, 7 & 8 Complete**  
**Date:** October 2026  
**Operating System:** Windows 11 (AMD64)  
**Active Workspace:** `C:\Users\srira\Desktop\3-1\CNAD\agri`  


---

## 1. Verified Tools & Runtime Status

| Tool | Component | Version | Installation Path | Availability Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Java** | Oracle JDK | 21.0.12.1 LTS | `C:\Program Files\Java\jdk-21.0.12.1` | **Available** | Verified via `java -version` |
| **Maven** | Apache Maven | 3.10.0 | `C:\Program Files\apache-maven-3.10.0\bin\mvn.cmd` | **Available** | Verified via `mvn -v` |
| **Node.js** | Node Runtime | v22.21.0 | `C:\Program Files\nodejs\node.exe` | **Available** | Verified via `node -v` |
| **npm** | Node Package Mgr | 10.9.4 | `C:\Program Files\nodejs\npm.cmd` | **Available** | Verified via `npm -v` |
| **Git** | Git for Windows | 2.50.1.windows.1 | `C:\Program Files\Git\cmd\git.exe` | **Available** | Verified via `git --version` |
| **MySQL Server** | Windows Service | 8.0 (`MySQL80`) | `C:\Program Files\MySQL\MySQL Server 8.0` | **Available (Service Running)** | Active on Port 3306. Live schemas: `users`, `crops`, `cart_items`, `customer_orders`, `order_items`. |
| **Docker CLI** | Docker Engine CLI | 29.1.5 | `C:\Program Files\Docker\Docker\resources\bin\docker.exe` | **Available** | CLI binary accessible. |
| **Docker Compose** | Compose Plugin | v5.0.1 | Integrated in Docker CLI | **Available** | `docker compose config` validated cleanly. |
| **Docker Desktop**| Daemon / Engine | — | — | **Requires Desktop Launch** | Windows named pipe requires desktop elevation. |
| **Minikube** | CLI & Orchestrator | v1.38.1 | `C:\minikube\minikube.exe` | **Available (Cluster Stopped)** | CLI available; requires Docker engine to run cluster. |
| **kubectl** | K8s CLI | v1.34.1 | `C:\Program Files\Docker\Docker\resources\bin\kubectl.exe` | **Available (Client Ready)** | Client validated with `kubectl kustomize`. |
| **Helm** | Kubernetes Package Mgr | v4.1.4 | `C:\Program Files\Docker\Docker\resources\bin\helm.exe` | **Available** | Linting and template rendering verified. |
| **Python** | Python Runtime | 3.11.9 | Standard PATH | **Available** | FastAPI microservice running on port 8000. |

---

## 2. Workspace Structure

```
agri-marketplace/
├── .gitignore                          # Multi-stack Git ignore rules (React, Spring Boot, Python, Docker)
├── docs/                               # Architectural & status documentation
│   ├── PROJECT_STATUS.md
│   └── phase6_ai_service_implementation_plan.md
├── ai-service/                         # Python 3.11 FastAPI AI Microservice (Port 8000)
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── README.md
│   ├── app/
│   │   ├── main.py                     # FastAPI app with CORS and /health endpoint
│   │   ├── schemas.py                  # Pydantic validation models
│   │   ├── services/
│   │   │   ├── forecasting.py          # Autoregressive Ridge lag model + Baseline Persistence
│   │   │   ├── pricing.py              # Explainable rule engine with cost-floor protection
│   │   │   └── profit.py               # Revenue, verified production cost, and profit margins
│   │   └── routers/
│   │       ├── forecast.py             # POST /api/forecast/demand
│   │       ├── pricing.py              # POST /api/pricing/recommend
│   │       └── profit.py               # POST /api/profit/analyze
│   └── tests/
│       └── test_ai_service.py          # Pytest test suite (11 tests passed)
├── frontend/                           # React 18 + Vite 6 + Tailwind CSS frontend application
│   ├── package.json                    # Scripts: dev, build, preview, test (Vitest)
│   ├── vite.config.js                  # Includes /api and /actuator proxy + Vitest jsdom config
│   ├── tailwind.config.js              # Custom Forest and Earth themes
│   ├── postcss.config.js
│   ├── index.html
│   ├── README.md                       # Frontend execution and routing documentation
│   └── src/
│       ├── main.jsx                    # Root React DOM mount
│       ├── App.jsx                     # Route definitions including /farmer/insights
│       ├── index.css                   # Tailwind imports and base styles
│       ├── __tests__/                  # Vitest automated test suite (11 tests passed)
│       │   ├── auth.test.jsx           # Authentication and registration tests
│       │   ├── cart_order.test.jsx     # Shopping cart and order lifecycle tests
│       │   └── ai_insights.test.jsx    # AI dashboard, forecast chart, and pricing factor tests
│       ├── api/
│       │   ├── client.js               # Configured Axios client (withCredentials: true, CSRF interceptor)
│       │   ├── authService.js          # Authentication API methods
│       │   ├── cropService.js          # REST crop methods
│       │   ├── cartService.js          # Cart API client methods
│       │   ├── orderService.js         # Order placement and lifecycle methods
│       │   └── aiService.js            # AI forecasting, pricing, and profit API methods
│       ├── context/
│       │   ├── AuthContext.jsx         # React context for user session state & role helpers
│       │   └── CartContext.jsx         # React context for cart items, badge counts, and quantity management
│       ├── pages/
│       │   ├── FarmerInsightsPage.jsx  # AI Demand Forecasting, Pricing & Profit Dashboard

│       │   ├── CropCard.jsx            # Crop card with quick "Add to Cart" and "View Details"
│       │   ├── CropDetailModal.jsx     # Listing dialog with quantity selector & Add to Cart
│       │   └── LoadingSkeleton.jsx     # Card skeleton loading state
│       └── pages/
│           ├── HomePage.jsx            # Hero, quick search, featured crop cards, upcoming AI preview
│           ├── MarketplacePage.jsx     # Filterable, sortable, searchable crop catalog
│           ├── SellCropPage.jsx        # Harvest listing form with role & authentication guards
│           ├── DashboardPage.jsx       # Aggregated metrics, volume, valuation, and backend telemetry
│           ├── LoginPage.jsx           # User sign in with test account helpers
│           ├── RegisterPage.jsx        # Registration with Customer vs Farmer selection
│           ├── CartPage.jsx            # Shopping cart management, subtotals, and checkout address form
│           ├── OrdersPage.jsx          # Customer order history, tracking badges, and cancellation
│           └── FarmerOrdersPage.jsx    # Producer order fulfillment portal with stage transitions
├── backend/                            # Spring Boot REST microservice (Java 21, Maven, Spring Boot 3.5.9)
│   ├── pom.xml                         # Spring Security, JPA, Validation, Actuator, MySQL, H2, Test
│   ├── README.md                       # Backend instructions, security architecture & API guide
│   └── src/
│       ├── main/java/com/agri/marketplace/
│       │   ├── AgriMarketplaceApplication.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── CartController.java # /api/cart/** endpoints for CUSTOMER
│       │   │   ├── CropController.java
│       │   │   ├── HealthController.java
│       │   │   └── OrderController.java# /api/orders/** endpoints
│       │   ├── dto/
│       │   │   ├── AddToCartRequestDto.java
│       │   │   ├── CartItemResponseDto.java
│       │   │   ├── CartSummaryResponseDto.java
│       │   │   ├── CropRequestDto.java
│       │   │   ├── CropResponseDto.java
│       │   │   ├── CsrfResponseDto.java
│       │   │   ├── ErrorResponseDto.java
│       │   │   ├── FarmerOrderItemResponseDto.java
│       │   │   ├── HealthResponseDto.java
│       │   │   ├── LoginRequestDto.java
│       │   │   ├── OrderItemResponseDto.java
│       │   │   ├── OrderResponseDto.java
│       │   │   ├── PlaceOrderRequestDto.java
│       │   │   ├── RegisterRequestDto.java
│       │   │   ├── UpdateCartItemRequestDto.java
│       │   │   ├── UpdateOrderStatusRequestDto.java
│       │   │   └── UserResponseDto.java
│       │   ├── entity/
│       │   │   ├── CartItem.java       # Customer-crop cart association
│       │   │   ├── Crop.java           # Crop harvest listings
│       │   │   ├── Order.java          # Customer orders (table: customer_orders)
│       │   │   ├── OrderItem.java      # Order line item with immutable price/name snapshots
│       │   │   ├── OrderStatus.java    # PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED, CANCELLED
│       │   │   ├── Role.java           # CUSTOMER, FARMER, ADMIN
│       │   │   └── User.java           # User entity
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   ├── InsufficientStockException.java
│       │   │   └── ResourceNotFoundException.java
│       │   ├── repository/
│       │   │   ├── CartItemRepository.java
│       │   │   ├── CropRepository.java # Features findByIdWithLock (PESSIMISTIC_WRITE)
│       │   │   ├── OrderItemRepository.java
│       │   │   ├── OrderRepository.java
│       │   │   └── UserRepository.java
│       │   ├── security/
│       │   │   ├── CustomUserDetailsService.java
│       │   │   ├── DataReconciliationRunner.java
│       │   │   └── SecurityConfig.java
│       │   └── service/
│       │       ├── AuthService.java / AuthServiceImpl.java
│       │       ├── CartService.java / CartServiceImpl.java
│       │       ├── CropService.java / CropServiceImpl.java
│       │       └── OrderService.java / OrderServiceImpl.java
```

---

## 3. Phase 5 Accomplishments

### Database & JPA Entities
1. **`CartItem`:** `@Table(name = "cart_items")` with unique composite constraint on `(customer_id, crop_id)`.
2. **`Order`:** `@Table(name = "customer_orders")` to prevent SQL keyword conflict with `ORDER`. Stores customer reference, total amount, lifecycle status, delivery address, timestamps, and cascaded order items.
3. **`OrderItem`:** Immutable historical snapshot capturing `cropNameSnapshot` and `pricePerKgSnapshot`, ensuring past customer receipts and farmer revenues remain accurate even if listings are subsequently modified.
4. **Pessimistic Concurrency Locking:** `CropRepository.findByIdWithLock(Long id)` utilizes `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`), preventing race conditions and overselling when multiple customers check out concurrently.

### Order Lifecycle State Machine
```
[CUSTOMER PLACES ORDER]
        ↓
     PLACED ────────── (Customer/Admin Cancel) ──────→ CANCELLED (Stock Restored)
        ↓
    CONFIRMED ──────── (Customer/Admin Cancel) ──────→ CANCELLED (Stock Restored)
        ↓
     PACKED (Cannot be cancelled by customer)
        ↓
     SHIPPED
        ↓
    DELIVERED (Terminal fulfilled state)
```

### Authorization & Access Control
- **Customer Shopping Cart:** Restricted strictly to `CUSTOMER` role. Customers can access only their own items.
- **Stock Revalidation:** Validated immediately upon adding to cart and re-checked under lock at checkout.
- **Transactional Stock Decrement & Restoration:** Stock decrements atomically on checkout; stock restores transactionally if an eligible unfulfilled order (`PLACED` or `CONFIRMED`) is cancelled.
- **Farmer Order Isolation:** Farmers can view and advance only order items belonging to crops they listed (`GET /api/orders/farmer`). Private customer details and other farmers' orders are protected.

### Verification Results
1. **Backend Integration Tests:** `51 passed`, `0 failures`, `0 errors` (includes cart operations, isolation, stock limits, pessimistic concurrency rollback, snapshots, and lifecycle progression).
2. **Frontend Unit & Component Tests:** `8 passed across 2 suites` (`auth.test.jsx`, `cart_order.test.jsx`).
3. **Frontend Production Build:** `vite build` completed in `4.16s` with zero errors.
4. **End-to-End Live Workflow:** Executed against live Spring Boot and MySQL 8:
   - Registered customer `phase5_buyer@market.com`
   - Added 15 kg Organic Sharbati Wheat to cart
   - Placed Order #1 with delivery address (cart cleared atomically)
   - Stock decremented in MySQL from 1500.00 kg to 1485.00 kg
   - Farmer `farmer@agrimarket.com` logged in and viewed Order #1 in fulfillment portal
   - Advanced order status to `CONFIRMED`
5. **Browser Subagent Walkthrough:** Completed end-to-end user and farmer session simulation with video recording saved at `phase5_cart_order_walkthrough_1793093870652.webp`.

---

## 4. Phase 6 Accomplishments: AI Demand Forecasting, Dynamic Pricing & Profit Intelligence

### Microservice Architecture
1. **Python AI Service (`ai-service/`):**
   - Built with Python 3.11, FastAPI, Pydantic, Pandas, NumPy, and Scikit-learn.
   - REST endpoints: `GET /health`, `POST /api/forecast/demand`, `POST /api/pricing/recommend`, `POST /api/profit/analyze`.
   - Automated Pytest suite: **11 passed**, `0 failures`.

2. **Demand Forecasting Methodology & Guardrails:**
   - Aggregates actual historical order quantities (demand is strictly customer orders, not listing stock).
   - Zero-fills missing intermediate calendar dates to prevent temporal distortion.
   - Chronological train/test split (80% train / 20% test) to prevent future data leakage.
   - Benchmarks regularized Ridge autoregression against Naive Previous-Period Persistence Baseline, reporting MAE and RMSE metrics.
   - **Data Sparsity Guard:** When distinct historical intervals < 5 (as in early-stage deployments), returns transparent `status: "INSUFFICIENT_DATA"` with a fallback average projection instead of claiming an ML model is reliable.

3. **Explainable Dynamic Pricing Engine:**
   - Distinguishes rule-based heuristics (`EXPLAINABLE_RULE_ENGINE`) from trained models (`HYBRID_ML_RULE`).
   - Evaluates inventory pressure (stock vs velocity), farmer cost floor, and validated demand trajectory.
   - **Non-destructive Guardrail:** Farmer review required; prices are never modified automatically without explicit farmer confirmation.

4. **Profit Intelligence & Data Integrity:**
   - Gross revenue computed strictly from verified customer order records.
   - Production costs are **never** inferred or guessed from sales revenue.
   - Net profit and margins are calculated only when farmer inputs verified cost per kg; otherwise reported as unavailable.
   - Strict farmer ownership isolation enforced in Spring Boot (`AiIntelligenceService`).

5. **Spring Boot Backend Client:**
   - RestClient integration with configurable URL (`AI_SERVICE_URL`) and 5-second connection/read timeouts.
   - Graceful fallback with HTTP 503 `SERVICE_UNAVAILABLE` on microservice failure, omitting credentials and stack traces.
   - Spring Boot integration tests: **59 passed**, `0 failures`, `0 errors`.

6. **React Dashboard Integration (`/farmer/insights`):**
   - Visual demand forecast projection chart with fallback indicators.
   - Dynamic price recommendation card with recommended price range band and factor pills.
   - Cost per kg interactive input with live recalculation.
   - Revenue, cost, net profit, and crop margin breakdown table.
   - Loading skeletons and service-down error states.
   - Vitest automated tests: **11 passed across 3 suites**.
   - Production build: `vite build` succeeded in **4.91s**.
   - Live browser walkthrough recording: `phase6_ai_insights_walkthrough_1793096915167.webp`.

---

## 5. Phase 7 Accomplishments: Docker, Kubernetes, CI/CD & Cloud-Native Deployment

### Multi-Stage Containerization
1. **Backend (`backend/Dockerfile`):**
   - Multi-stage build (`maven:3.9.9-eclipse-temurin-21-alpine` -> `eclipse-temurin:21-jre-alpine`).
   - Unprivileged user `spring:spring` (`UID 10001`, `GID 10001`).
   - Probes Spring Boot Actuator at `http://localhost:8080/actuator/health`.
   - JVM container-aware memory allocation flags configured.
2. **Frontend (`frontend/Dockerfile`):**
   - Multi-stage build (`node:22-alpine` -> `nginx:1.27-alpine`).
   - Custom `nginx.conf` reverse proxy routing `/api/` directly to backend service with CORS & CSRF token preservation.
   - SPA fallback `try_files $uri $uri/ /index.html` for client-side routing.
   - Gzip compression, security headers, and `/` healthcheck configured.
3. **AI Service (`ai-service/Dockerfile`):**
   - Built on `python:3.11-slim-bookworm` with unprivileged user `appuser` (`UID 10001`).
   - Stripped build-essential tools to minimize attack surface and size.
   - Healthcheck probing `http://localhost:8000/health`.
4. **Local Multi-Container Orchestration (`compose.yaml`):**
   - Interlinks `mysql`, `ai-service`, `backend`, and `frontend`.
   - Healthcheck on MySQL (`mysqladmin ping -h 127.0.0.1`) with `condition: service_healthy` on backend.
   - Loopback-only port binding for MySQL (`127.0.0.1:3307:3306`) preventing public database exposure.
   - Persistent volume `mysql_data` for data safety.
   - Environment variables parameterized via `.env.example`.
   - Syntax validation: `docker compose --env-file .env.example config` verified with **exit code 0**.

### Kubernetes Manifests (`deployment/k8s/`)
1. **Namespacing & Configuration:** Dedicated `agri-marketplace` namespace, ConfigMaps for environment parameters, and `secrets.yaml.example` for sensitive credentials.
2. **Pod Security:** Non-root security contexts (`runAsNonRoot: true`, `runAsUser: 10001`) enforced for all application workloads.
3. **Storage:** `mysql-pvc` with `ReadWriteOnce` access mode and 5Gi persistent volume claim.
4. **Probes & Resources:** Explicit CPU/memory resource requests and limits, readiness probes, and liveness probes configured for each tier.
5. **Validation:** `kubectl kustomize deployment/k8s` executed and passed cleanly with **exit code 0**.

### Helm Packaging (`deployment/helm/agri-marketplace/`)
1. **Chart Structure:** Standard Helm chart (`v0.1.0`, application `v1.0.0`) with templates for all 4 application tiers, PVC, ConfigMap, and Secrets.
2. **Configuration Overrides:** `values.yaml` provides production defaults; `values-local.yaml` provides local Minikube demo overrides with `IfNotPresent` pull policies and NodePort service.
3. **Linting & Templating:**
   - `helm lint deployment/helm/agri-marketplace` -> **0 chart(s) failed**.
   - `helm template agri-marketplace deployment/helm/agri-marketplace -f deployment/helm/agri-marketplace/values-local.yaml` -> **exit code 0**.

### CI/CD Pipelines (`.github/workflows/`)
1. **Continuous Integration (`ci.yaml`):**
   - Parallel test jobs for Backend (Java 21, Maven), AI Service (Python 3.11, Pytest), and Frontend (Node 22, Vitest, Vite Build).
   - Manifest validation jobs: Helm chart linting, Helm template rendering, and Kustomize build validation.
   - Docker build validation job verifying Dockerfiles without publishing.
2. **Continuous Deployment (`cd.yaml`):**
   - Triggered on semantic release tags (`v*.*.*`).
   - Conditional check ensuring Docker registry secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`) exist before attempting to publish.
   - Multi-image build and push with Git commit SHA and version tags.

---

## 6. Phase 8 Accomplishments: Multilingual Support — English, Telugu and Hindi

### Multilingual Architecture & Technology Stack
1. **i18next Framework (`frontend/src/i18n/`):**
   - Configured with `i18next` and `react-i18next`.
   - Supported languages:
     - English (`en`) — Default fallback.
     - Telugu (`te`) — `తెలుగు`.
     - Hindi (`hi`) — `हिन्दी`.
   - Instant language switching without page reloads, session drops, or cart clearance.
   - User preference persisted in `localStorage` under key `app_language`.
   - HTML document `lang` attribute dynamically synchronized (`<html lang="en">`, `<html lang="te">`, `<html lang="hi">`).
   - Missing translation key fallback guardrails: graceful fallback to default value or English key.

2. **Translation Catalogs:**
   - Dedicated JSON translation files organized under:
     - `frontend/src/i18n/locales/en/translation.json`
     - `frontend/src/i18n/locales/te/translation.json`
     - `frontend/src/i18n/locales/hi/translation.json`
   - Complete coverage over 12 namespaces: `nav`, `home`, `marketplace`, `sellCrop`, `auth`, `cart`, `orders`, `farmerOrders`, `insights`, `crop`, `dashboard`, `common`.

3. **Accessible Language Selector Component (`frontend/src/components/LanguageSelector.jsx`):**
   - Desktop: Accessible dropdown button with globe icon, current language name, ARIA attributes (`aria-haspopup="listbox"`, `aria-expanded`), and keyboard navigable option items.
   - Mobile: Clean inline radio button group rendering native language names (`English`, `తెలుగు`, `हिन्दी`).
   - Visual active language indicator with accent borders and check marks.

4. **Localization of Numbers, Currency and Dates (`frontend/src/utils/formatters.js`):**
   - Regional locale mapping:
     - English: `en-IN`
     - Telugu: `te-IN`
     - Hindi: `hi-IN`
   - Currency: Strict preservation of Indian Rupees (`₹`) via `Intl.NumberFormat(locale, { style: 'currency', currency: 'INR' })`.
   - Quantities and Numbers: Formatted using regional thousand separators while preserving numeric floating-point values for underlying arithmetic and order placement totals.
   - Dates and Timestamps: Formatted using `Intl.DateTimeFormat(locale, ...)`.

5. **Unicode Typography & Layout Integrity:**
   - Google Fonts integration for Unicode-compatible scripts:
     - `Noto Sans Telugu`
     - `Noto Sans Devanagari`
     - `Inter`
   - Retained responsive grid layouts, card alignments, and mobile navigation without character clipping or layout breakage.

6. **Database & API Integrity:**
   - Interface translated strictly; MySQL crop names, customer records, and order records are preserved untouched.
   - Spring Boot REST APIs, Spring Security HttpOnly cookies, and FastAPI calculations remain 100% compliant and unaffected.

7. **Verification & Test Suite Results:**
   - **Frontend Vitest (`multilingual.test.jsx`, `ai_insights.test.jsx`, `cart_order.test.jsx`, `auth.test.jsx`):**
     - **21 passed**, `0 failures` (across 4 test suites).
   - **Frontend Production Build (`vite build`):**
     - **Succeeded with exit code 0** (built in 8.22s, 1697 modules transformed).
   - **Backend Spring Boot Maven Suite (`backend/`):**
     - **59 passed**, `0 failures`, `0 errors`, `BUILD SUCCESS`.
   - **AI Service Pytest Suite (`ai-service/`):**
     - **11 passed**, `0 failures` in 9.31s.


