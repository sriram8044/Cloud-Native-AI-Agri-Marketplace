# Phase 6 Implementation Plan: AI Demand Forecasting, Dynamic Pricing & Profit Intelligence

## 1. Executive Summary & Existing Data Assessment

The Cloud-Native AI Agri Marketplace currently operates with:
- **Backend**: Spring Boot 3.5.9 on Java 21, Spring Security, MySQL 8.
- **Frontend**: React 18, Vite, Tailwind CSS.
- **Database Entities**: `Crop`, `User`, `CartItem`, `Order`, `OrderItem`.
- **Order Tracking**: Orders capture `customer`, `totalAmount`, `status` (`PLACED`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`), and `createdAt` timestamp. Order items capture `crop_id`, `farmer_id`, `cropNameSnapshot`, `pricePerKgSnapshot`, `quantityKg`, and `lineTotal`.

### Current Data Limitations
1. **Sample Size**: The development database currently holds 3 active crop listings and 1 completed customer order (15.00 kg of Organic Sharbati Wheat at ₹42.50/kg).
2. **Sparsity**: As with any early-stage agricultural marketplace, historical daily order volume is sparse. Real-world order frequency varies across seasonal harvest cycles.
3. **Target Variable Definition**: **Demand** is strictly defined as actual customer orders (`quantityKg` from non-cancelled orders: `PLACED`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`). `availableQuantityKg` on a crop listing is current inventory/supply, **not** demand.
4. **Data Integrity Principle**: We will **not** fabricate false customer orders or delete existing transaction history.
5. **Handling Sparsity**: The AI forecasting engine will explicitly detect sparse historical data (fewer than 5 distinct historical time intervals). When data is insufficient, it returns an explicit `status: "INSUFFICIENT_DATA"` with a clear explanation, fallback naive estimate, and data collection guidance, rather than pretending an ML model is statistically reliable.

---

## 2. System Architecture & API Contracts

```
+-------------------------------------------------------------------------------+
|                             React Frontend                                    |
|                      Route: /farmer/insights                                  |
|   - Crop Selector & Time Horizon (7 / 14 / 30 days)                           |
|   - Demand Forecast Visualization & Model Evaluation (MAE, RMSE, Baseline)   |
|   - Explainable Price Recommendation & Dynamic Factors Breakdown             |
|   - Profit Intelligence (Revenue, Cost Input, Net Profit, Margin %)          |
|   - Data Sufficiency / Limitations Banners & Service Down Fallbacks           |
+-------------------------------------------------------------------------------+
                                      |
                               (HTTP + Cookie Session)
                                      v
+-------------------------------------------------------------------------------+
|                           Spring Boot Backend (:8080)                         |
|   - Security: verifies FARMER/ADMIN role and validates Crop Ownership         |
|   - Query: aggregates actual OrderItem data for target crop/farmer            |
|   - AI Client: RestClient with 5-second timeouts & fallback error handling    |
|   Endpoints:                                                                  |
|     GET  /api/ai/forecast/{cropId}?horizonDays=7                              |
|     POST /api/ai/pricing/{cropId}  (body: { costPerKg?: number })             |
|     POST /api/ai/profit/summary    (body: { cropCosts?: { [id]: number } })   |
+-------------------------------------------------------------------------------+
                                      |
                           (Internal JSON REST Client)
                                      v
+-------------------------------------------------------------------------------+
|                       Python FastAPI Service (:8000)                          |
|                       ai-service/app (Python 3.11)                            |
|   Endpoints:                                                                  |
|     GET  /health                                                              |
|     POST /api/forecast/demand                                                 |
|     POST /api/pricing/recommend                                               |
|     POST /api/profit/analyze                                                  |
+-------------------------------------------------------------------------------+
```

---

## 3. Machine Learning & Forecasting Methodology

1. **Zero-filling and Daily Aggregation**:
   - Time-series inputs are grouped by date. Missing dates within the historical range are explicitly filled with `quantity_kg = 0.0` (zero order days).
2. **Train / Test Split (Time-based)**:
   - For datasets with >= 5 time points, the earliest 80% forms the training split, and the most recent 20% forms the test split.
   - Prevents temporal data leakage (future records never appear in training set).
3. **Model Candidates & Evaluation**:
   - **Baseline Model**: Naive Persistence / Moving Average (predicts the last period's demand or rolling window mean).
   - **Evaluated Model**: Ridge Linear Regression / ElasticNet with lag features (Lag 1, Lag 2, day-of-week).
   - **Metrics**:
     - MAE = (1/n) * sum(|y_i - y_hat_i|)
     - RMSE = sqrt((1/n) * sum((y_i - y_hat_i)^2))
   - Both baseline and candidate model metrics are returned side-by-side so the farmer and reviewer see exact empirical accuracy.
4. **Insufficient Data Guard**:
   - If historical distinct time periods < 5, the model returns:
     - `status: "INSUFFICIENT_DATA"`
     - `has_sufficient_data: false`
     - Explicit limitations explaining that statistical generalization requires more order history.
     - Fallback naive projection with `is_fallback: true`.

---

## 4. Explainable Pricing Rules & Guardrails

1. **Non-destructive & Non-autonomous**:
   - Prices in the database are **never** changed by the recommendation endpoint.
   - The response includes `action_required: "Farmer review required. Prices will NOT be modified automatically."`
2. **Distinct Categorization**:
   - Marked explicitly as `methodology: "EXPLAINABLE_RULE_ENGINE"` (or `"HYBRID_ML_RULE"` when forecasting is statistically validated).
   - We will never falsely label a rule heuristic as a "Deep Neural Network" or "Trained AI Model".
3. **Three-Tier Factor Breakdown**:
   - **Inventory Pressure**: High stock relative to sales suggests competitive pricing; low stock permits premium pricing.
   - **Cost Floor**: If farmer enters cost per kg C, suggested price satisfies P_suggested >= 1.15 * C.
   - **Market Demand Velocity**: Based on historical order rate.

---

## 5. Profit Intelligence Principles

1. **Strict Cost Separation**:
   - Production cost is **never** estimated as a fixed percentage of price (e.g. "80% of revenue").
   - If cost per kg is omitted, `profit_margin_percent` and `estimated_profit` are returned as `null` with `status: "COST_DATA_MISSING"`.
2. **Farmer Isolation**:
   - Backend checks ensure `farmer_id` matches the authenticated user in Spring Security (`CustomUserDetails`).
   - A farmer can never see another farmer's revenue, crop costs, or order items.
