# Cloud-Native AI Agri Marketplace — Backend Service

The Spring Boot backend microservice for the Cloud-Native AI Agri Marketplace. Built with Spring Boot 3.5.9, Java 21, Spring Security, Spring Data JPA, and MySQL 8.

---

## 1. Prerequisites

- **Java Development Kit (JDK):** Java 21 LTS (`jdk-21.0.12.1`)
- **Build Tool:** Apache Maven 3.10.0+
- **Database:** MySQL 8.0+ running on port `3306`

---

## 2. Environment Variables & Safe Configuration

Database credentials and server parameters are configured via environment variables with safe development defaults.

| Environment Variable | Description | Default Fallback |
| :--- | :--- | :--- |
| `DB_URL` | JDBC URL for MySQL database | `jdbc:mysql://localhost:3306/agri_marketplace?createDatabaseIfNotExist=false&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `DB_USERNAME` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database password | `""` (empty) |
| `JPA_DDL_AUTO` | Hibernate schema management | `update` *(Development only)* |
| `JPA_SHOW_SQL` | Log SQL queries | `false` |

> [!NOTE]  
> **Production Notice:** `ddl-auto=update` is used strictly for development. Production deployments must use schema migration tools (Flyway or Liquibase). Passwords and session secrets must never be committed to source control.

---

## 3. Security, Roles & Order Lifecycle Architecture

### Authentication Mechanism
- **Stateful Server-Managed Sessions:** Uses HttpOnly `JSESSIONID` cookies. Session identifiers are managed by the browser and are never stored in `localStorage` or `sessionStorage`.
- **BCrypt Password Hashing:** All user passwords are encrypted using `BCryptPasswordEncoder` (strength 12) before persistence in MySQL.
- **CSRF Protection:** Configured with `CookieCsrfTokenRepository.withHttpOnlyFalse()`. Clients send `X-XSRF-TOKEN` on all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **CORS Policy:** Restricts access to development origins (`http://localhost:5173`, `http://127.0.0.1:5173`) with `allowCredentials=true` and supports `GET, POST, PUT, PATCH, DELETE, OPTIONS`.

### Role-Based Access Control (RBAC)
1. **`CUSTOMER`:**
   - Public crop browsing and searching.
   - Manages personal shopping cart (`/api/cart/**`).
   - Places orders atomically from shopping cart (`POST /api/orders`).
   - Views personal order history (`GET /api/orders/my`).
   - Can cancel eligible unfulfilled orders (`PLACED` or `CONFIRMED`), triggering transactional stock restoration.
2. **`FARMER`:**
   - Publishes, edits, and removes own crop listings (`/api/crops`).
   - Views order fulfillment items for their own crops only (`GET /api/orders/farmer`).
   - Advances fulfillment statuses: `PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED`.
   - Cannot access private customer records or order items belonging to other farmers.
   - Cannot directly cancel customer orders.
3. **`ADMIN`:**
   - Full oversight across all listings, user accounts, and order management.

### Stock Safety & Concurrency Control
- **Pessimistic Locking:** `CropRepository.findByIdWithLock(id)` uses `LockModeType.PESSIMISTIC_WRITE` (`SELECT ... FOR UPDATE`).
- **Atomic Operations:** Stock revalidation, stock decrement, order creation, order item snapshotting, and customer cart clearance execute inside a single `@Transactional` boundary.
- **Overselling Prevention:** If available stock drops below requested quantity during checkout, transaction rolls back immediately with HTTP 400 Bad Request.
- **Historical Immutability:** `cropNameSnapshot` and `pricePerKgSnapshot` are recorded on `OrderItem` at checkout time, preventing retroactive price modifications.
- **Monetary Precision:** All prices, quantities, and order totals strictly use `BigDecimal` with `RoundingMode.HALF_UP` (no floating-point types).

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

---

## 4. Database Schema Changes (Phase 5)

### `cart_items` Table
- `id` (BIGINT, Primary Key, Auto-Increment)
- `customer_id` (BIGINT, Foreign Key to `users.id`)
- `crop_id` (BIGINT, Foreign Key to `crops.id`)
- `quantity_kg` (DECIMAL(12, 2), NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- **Constraint:** Unique index on `(customer_id, crop_id)` prevents duplicate cart entries.

### `customer_orders` Table
- `id` (BIGINT, Primary Key, Auto-Increment)
- `customer_id` (BIGINT, Foreign Key to `users.id`)
- `total_amount` (DECIMAL(12, 2), NOT NULL)
- `status` (VARCHAR(30), NOT NULL: `PLACED`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
- `delivery_address` (VARCHAR(500), NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `order_items` Table
- `id` (BIGINT, Primary Key, Auto-Increment)
- `order_id` (BIGINT, Foreign Key to `customer_orders.id`)
- `crop_id` (BIGINT, Foreign Key to `crops.id`)
- `farmer_id` (BIGINT, Foreign Key to `users.id`)
- `crop_name_snapshot` (VARCHAR(100), NOT NULL)
- `price_per_kg_snapshot` (DECIMAL(10, 2), NOT NULL)
- `quantity_kg` (DECIMAL(12, 2), NOT NULL)
- `line_total` (DECIMAL(12, 2), NOT NULL)

---

## 5. API Endpoints Reference

### Shopping Cart Endpoints (`/api/cart`) — CUSTOMER Role Only
- `GET /api/cart` — Retrieve customer's active cart with subtotal and item list (200 OK).
- `POST /api/cart/items` — Add crop item to cart or merge quantity (201 Created).
- `PUT /api/cart/items/{id}` — Update item quantity (200 OK).
- `DELETE /api/cart/items/{id}` — Remove single item from cart (200 OK).
- `DELETE /api/cart` — Clear entire shopping cart (200 OK).

### Order Management Endpoints (`/api/orders`)
- `POST /api/orders` — Place order from customer's cart (**CUSTOMER**, 201 Created).
- `GET /api/orders/my` — Customer order history (**CUSTOMER**, 200 OK).
- `GET /api/orders/{id}` — Order detail (**Authenticated: Customer Owner, Farmer with items, or Admin**, 200 OK).
- `GET /api/orders/farmer` — Producer fulfillment items (**FARMER or ADMIN**, 200 OK).
- `PATCH /api/orders/{id}/status` — Status lifecycle transitions (**Authenticated with role-based state checks**, 200 OK).

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` — Register a `CUSTOMER` or `FARMER` account (201 Created).
- `POST /api/auth/login` — Authenticate credentials and establish session (200 OK, sets `JSESSIONID`).
- `POST /api/auth/logout` — Invalidate session and clear SecurityContext (200 OK).
- `GET /api/auth/me` — Return current authenticated user profile without credentials (200 OK or 401).
- `GET /api/auth/csrf` — Obtain CSRF token metadata (200 OK).

### Crop Marketplace Endpoints (`/api/crops`)
- `GET /api/crops` — Retrieve all crops (**Public**, 200 OK).
- `GET /api/crops/{id}` — Retrieve crop by ID (**Public**, 200 OK).
- `GET /api/crops?search={term}` — Search crops by name (**Public**, 200 OK).
- `POST /api/crops` — Create a crop listing (**FARMER or ADMIN required**, 201 Created).
- `PUT /api/crops/{id}` — Update crop listing (**Owner FARMER or ADMIN only**, 200 OK).
- `DELETE /api/crops/{id}` — Delete crop listing (**Owner FARMER or ADMIN only**, 200 OK).

### AI Demand Forecasting, Pricing & Profit Intelligence (Phase 6)
- `GET /api/ai/forecast/{cropId}?horizon={horizon}` — Explainable demand forecast with model baseline evaluation and data sparsity guardrails (**FARMER or ADMIN only**, 200 OK).
- `POST /api/ai/pricing/{cropId}` — Dynamic price recommendation with explainable factors and cost floor protection (**FARMER or ADMIN only**, 200 OK).
- `POST /api/ai/profit/summary` — Farmer crop profit intelligence with verified costs and margin calculation (**FARMER or ADMIN only**, 200 OK).
- `GET /api/ai/profit/summary` — Default profit intelligence query for farmer's active listings (**FARMER or ADMIN only**, 200 OK).

### System Health Endpoints
- `GET /api/health` — Application health check JSON (`status: UP`).
- `GET /actuator/health` — Spring Boot Actuator health status.

---

## 6. How to Build & Run Tests

Automated tests execute against an isolated in-memory H2 database with MockMvc, Mockito, and Spring Security Test annotations. **Your local MySQL data is never modified during tests.**

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12.1"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd C:\Users\srira\Desktop\3-1\CNAD\agri\backend

mvn clean test
```

**Test Results:** 59 passed, 0 failures, 0 errors.

### Running the Application in Development
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12.1"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd C:\Users\srira\Desktop\3-1\CNAD\agri\backend

$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "<YOUR_MYSQL_PASSWORD>"
$env:AI_SERVICE_URL = "http://localhost:8000"

mvn spring-boot:run
```

---

## 7. Containerization & Cloud-Native Deployment (Phase 7)

The backend includes a production-ready multi-stage `Dockerfile`:
- **Stage 1 (Builder):** Uses `maven:3.9.9-eclipse-temurin-21-alpine` to compile and package the fat JAR.
- **Stage 2 (Runtime):** Uses minimal `eclipse-temurin:21-jre-alpine` runtime.
- **Security:** Runs as an unprivileged, non-root user `spring:spring` (`UID 10001`, `GID 10001`).
- **Health Check:** Probes `/actuator/health` every 30 seconds.
- **JVM Flags:** Configured for container memory awareness (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`).

### Building the Backend Docker Image
```powershell
docker build -t agri-backend:1.0.0 ./backend
```

### Running the Backend Container Standalone
```powershell
docker run -d `
  --name agri-backend `
  -p 8080:8080 `
  -e DB_URL="jdbc:mysql://host.docker.internal:3306/agri_marketplace?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true" `
  -e DB_USERNAME="root" `
  -e DB_PASSWORD="your_password" `
  -e AI_SERVICE_URL="http://host.docker.internal:8000" `
  agri-backend:1.0.0
```


