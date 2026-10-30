# Cloud-Native AI Agri Marketplace — Frontend

The modern, responsive React frontend for the Cloud-Native AI Agri Marketplace. Built with React 18, Vite 6, Tailwind CSS, Axios, and React Router.

---

## 1. Overview & Architecture

The frontend provides an intuitive marketplace interface for farmers to list agricultural produce and for commercial/retail buyers to browse, search, add to cart, and place orders directly with producers.

### Key Features
- **Session-Based Authentication:** Clean user sign-in and registration with server-managed HttpOnly sessions. No sensitive session tokens are stored in `localStorage`.
- **Automatic CSRF Token Attachment:** Axios request interceptor automatically extracts the `XSRF-TOKEN` cookie and sets the `X-XSRF-TOKEN` header on state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Interactive Shopping Cart:** Real-time customer cart (`/cart`) with quantity adjustment, item removal, stock limit validation, and live subtotal/total calculations.
- **Atomic Checkout & Address Entry:** Customer delivery address capture with pessimistic stock locking and atomic cart clearance upon order placement.
- **Customer Order Tracking:** History page (`/orders`) showing lifecycle status (`PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED`), historical price snapshots, and cancellation with automatic stock restoration.
- **Farmer Order Fulfillment:** Dedicated producer portal (`/farmer/orders`) where farmers inspect incoming orders for their crops and advance fulfillment progression.
- **Role-Aware UI:** Navigation and actions dynamically adapt based on user role (`CUSTOMER`, `FARMER`, `ADMIN`).
- **Backend Telemetry:** Continuous live health check badge to the Spring Boot backend (`GET /api/health`).

---

## 2. Available Routes

| Route | Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | Hero, quick search, featured crop listings, upcoming AI capabilities preview |
| `/marketplace` | `MarketplacePage` | Public | Searchable, filterable, and sortable crop catalog with quick Add to Cart |
| `/cart` | `CartPage` | Authenticated (`CUSTOMER`) | Shopping cart, quantity adjustment, subtotal, and checkout address form |
| `/orders` | `OrdersPage` | Authenticated (`CUSTOMER`) | Customer order history, status badges, and cancellation option |
| `/farmer/orders` | `FarmerOrdersPage` | Authenticated (`FARMER` / `ADMIN`) | Producer fulfillment dashboard with stage progression actions |
| `/farmer/insights` | `FarmerInsightsPage` | Authenticated (`FARMER` / `ADMIN`) | AI demand forecasting chart, dynamic pricing recommendations, and verified profit analytics |
| `/sell` | `SellCropPage` | Authenticated (`FARMER` / `ADMIN`) | Crop publishing form with client and backend validation |
| `/dashboard` | `DashboardPage` | Public | Inventory volume, valuation aggregation, and backend telemetry |
| `/login` | `LoginPage` | Public | User authentication with demo account quick-fill buttons |
| `/register` | `RegisterPage` | Public | Registration for Customer (Buyer) or Farmer (Producer) accounts |

---

## 3. How to Run Locally

### Prerequisites
- Node.js `v20+` or `v22+` (verified `v22.21.0`)
- npm `10+` (verified `10.9.4`)
- Spring Boot backend running on `http://localhost:8080`
- Python AI service running on `http://localhost:8000`

### Step 1: Install Dependencies
```powershell
cd C:\Users\srira\Desktop\3-1\CNAD\agri\frontend
npm install
```

### Step 2: Run Automated Tests
Runs the Vitest suite covering authentication UI, cart components, order history, AI insights, and Phase 8 Multilingual Support & Localization:
```powershell
npm test -- --run
```
**Test Results:** 21 passed across 4 test suites (`multilingual.test.jsx`, `ai_insights.test.jsx`, `cart_order.test.jsx`, `auth.test.jsx`).

---

## 5. Multilingual Support & Localization (Phase 8)

The frontend features complete, seamless internationalization without page reloads, session drops, or cart loss.

### Supported Languages
1. **English (`en`)** — Default fallback (`en-IN` locale formatting).
2. **Telugu (`te`)** — `తెలుగు` (`te-IN` locale formatting).
3. **Hindi (`hi`)** — `हिन्दी` (`hi-IN` locale formatting).

### Architecture & File Locations
```
frontend/src/
├── i18n/
│   ├── index.js                     # i18next configuration, localStorage persistence & html lang sync
│   └── locales/
│       ├── en/translation.json      # English translations (12 namespaces)
│       ├── te/translation.json      # Telugu translations
│       └── hi/translation.json      # Hindi translations
├── components/
│   └── LanguageSelector.jsx         # Accessible desktop dropdown & mobile radio language selector
└── utils/
    └── formatters.js                # Intl.NumberFormat & Intl.DateTimeFormat (currency ₹, numbers, dates)
```

### Font Stack & Unicode Typography
The interface loads Unicode fonts via Google Fonts in `index.html` and `index.css`:
- **Noto Sans Telugu** (Google Fonts)
- **Noto Sans Devanagari** (Google Fonts)
- **Inter** (Primary Latin typography)

### Localization of Numbers, Dates and Currency
- All monetary values are maintained in Indian Rupees (`₹`) using `Intl.NumberFormat(locale, { style: 'currency', currency: 'INR' })`.
- Numbers and quantities utilize locale group formatting while preserving numeric decimals for arithmetic operations.
- Dates and timestamps are formatted using `Intl.DateTimeFormat(locale, ...)`.

### How to Add a New Language
1. Create a new locale translation file: `frontend/src/i18n/locales/<lang_code>/translation.json` using `en/translation.json` as a template.
2. In `frontend/src/i18n/index.js`:
   - Import the new translation JSON: `import translation<CODE> from './locales/<lang_code>/translation.json';`
   - Register it under `resources`: `<lang_code>: { translation: translation<CODE> }`.
3. In `frontend/src/components/LanguageSelector.jsx`:
   - Add the language entry to `LANGUAGES` array: `{ code: '<lang_code>', label: '<Language Name in Native Script>', flag: '🌐' }`.
4. In `frontend/src/utils/formatters.js`:
   - Map `<lang_code>` to its BCP 47 locale tag (e.g. `'ta': 'ta-IN'`) in `LOCALE_MAP`.


### Step 3: Start Development Server
```powershell
npm run dev
```
Open your browser at:
👉 **`http://localhost:5173`**

### Step 4: Build for Production
```powershell
npm run build
```
Generates production assets in `dist/` with zero errors.

---

## 4. Containerization & Cloud-Native Deployment (Phase 7)

The frontend uses a multi-stage `Dockerfile`:
- **Stage 1 (Builder):** Uses `node:22-alpine` to install dependencies and execute `npm run build`.
- **Stage 2 (Runtime):** Uses lightweight `nginx:1.27-alpine` serving the static production bundle.
- **Reverse Proxy:** Built-in `nginx.conf` proxies `/api/` requests directly to `http://backend:8080/api/` (configurable via Docker Compose / Kubernetes Service DNS), resolving CORS issues and safeguarding HttpOnly cookies.
- **SPA Fallback:** Configured with `try_files $uri $uri/ /index.html` to support client-side React Router navigation.
- **Performance & Security:** Gzip compression enabled, security headers added (`X-Frame-Options`, `X-Content-Type-Options`), and container health check configured.

### Building the Frontend Docker Image
```powershell
docker build -t agri-frontend:1.0.0 ./frontend
```

### Running the Frontend Container Standalone
```powershell
docker run -d `
  --name agri-frontend `
  -p 3000:80 `
  agri-frontend:1.0.0
```
*(When running in Docker Compose or Kubernetes, the Nginx configuration automatically routes `/api/` traffic to the backend service).*

