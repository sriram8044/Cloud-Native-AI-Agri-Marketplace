"""Comprehensive test suite for the AI Service.

Validates:
1. Health endpoint.
2. Input validation for all endpoints.
3. Insufficient historical data handling & fallback.
4. Time-based evaluation & baseline comparison on sufficient data.
5. Pricing calculations, cost-floor protection, and factor explanations.
6. Profit intelligence with missing vs provided cost data.
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ------------------------------------------------------------------------------
# 1. Health Endpoint Tests
# ------------------------------------------------------------------------------

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["service"] == "agri-ai-service"
    assert "version" in data
    assert "timestamp" in data


# ------------------------------------------------------------------------------
# 2. Demand Forecast Tests
# ------------------------------------------------------------------------------

def test_forecast_input_validation():
    # Negative crop_id
    res = client.post("/api/forecast/demand", json={
        "crop_id": -1,
        "crop_name": "Wheat",
        "historical_orders": [],
        "horizon_days": 7
    })
    assert res.status_code == 422

    # Zero horizon
    res = client.post("/api/forecast/demand", json={
        "crop_id": 1,
        "crop_name": "Wheat",
        "historical_orders": [],
        "horizon_days": 0
    })
    assert res.status_code == 422


def test_forecast_zero_historical_orders():
    res = client.post("/api/forecast/demand", json={
        "crop_id": 1,
        "crop_name": "Organic Sharbati Wheat",
        "historical_orders": [],
        "horizon_days": 7
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INSUFFICIENT_DATA"
    assert data["has_sufficient_data"] is False
    assert data["historical_points_count"] == 0
    assert len(data["forecast"]) == 7
    assert all(pt["is_fallback"] is True for pt in data["forecast"])
    assert len(data["data_limitations"]) > 0


def test_forecast_insufficient_single_order():
    """Validates that a single order (like the current database state) returns INSUFFICIENT_DATA."""
    single_order = [{
        "order_date": "2026-10-27T13:40:00",
        "quantity_kg": 15.0,
        "price_per_kg": 42.50
    }]
    res = client.post("/api/forecast/demand", json={
        "crop_id": 1,
        "crop_name": "Organic Sharbati Wheat",
        "historical_orders": single_order,
        "horizon_days": 7
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INSUFFICIENT_DATA"
    assert data["has_sufficient_data"] is False
    assert data["historical_points_count"] == 1
    assert data["forecast_horizon_days"] == 7
    assert len(data["forecast"]) == 7
    # Baseline fallback provides average value without pretending to be a trained ML model
    assert data["forecast"][0]["predicted_demand_kg"] == 15.0
    assert data["forecast"][0]["is_fallback"] is True
    assert "insufficient" in data["data_limitations"][0].lower() or "observation" in data["data_limitations"][0].lower()


def test_forecast_sufficient_data_and_time_based_evaluation():
    """Generates 14 days of historical transactions to trigger model training and baseline comparison."""
    base_date = datetime(2026, 10, 1)
    orders = []
    # 14 days of realistic order activity with weekend peaks
    for i in range(14):
        dt = base_date + timedelta(days=i)
        qty = 20.0 + (i % 3) * 10.0 + (15.0 if dt.weekday() >= 5 else 0.0)
        orders.append({
            "order_date": dt.isoformat(),
            "quantity_kg": qty,
            "price_per_kg": 45.0
        })

    res = client.post("/api/forecast/demand", json={
        "crop_id": 1,
        "crop_name": "Organic Sharbati Wheat",
        "historical_orders": orders,
        "horizon_days": 5
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUFFICIENT_DATA"
    assert data["has_sufficient_data"] is True
    assert data["historical_points_count"] == 14
    assert len(data["forecast"]) == 5
    assert all(pt["is_fallback"] is False for pt in data["forecast"])

    # Evaluation metrics must be present and non-null
    baseline = data["baseline_model"]
    evaluated = data["evaluated_model"]
    assert baseline["mae"] is not None
    assert baseline["rmse"] is not None
    assert evaluated["mae"] is not None
    assert evaluated["rmse"] is not None
    assert "Persistence" in baseline["name"]
    assert "Ridge" in evaluated["name"]


# ------------------------------------------------------------------------------
# 3. Dynamic Pricing Recommendation Tests
# ------------------------------------------------------------------------------

def test_pricing_input_validation():
    # Negative price
    res = client.post("/api/pricing/recommend", json={
        "crop_id": 1,
        "crop_name": "Wheat",
        "current_price_per_kg": -10.0,
        "available_quantity_kg": 100.0
    })
    assert res.status_code == 422


def test_pricing_cost_floor_protection():
    """When farmer cost is ₹40, current price is ₹35, recommendation must enforce margin floor."""
    res = client.post("/api/pricing/recommend", json={
        "crop_id": 1,
        "crop_name": "Organic Sharbati Wheat",
        "current_price_per_kg": 35.0,
        "available_quantity_kg": 500.0,
        "cost_per_kg": 40.0,
        "historical_order_count": 2,
        "historical_total_demand_kg": 30.0
    })
    assert res.status_code == 200
    data = res.json()
    # 40 * 1.15 = 46.00 floor
    assert data["suggested_price_per_kg"] >= 46.00
    assert data["price_range"]["min_price_per_kg"] >= 46.00
    assert any("Cost" in f["factor"] for f in data["factors"])
    assert "review required" in data["action_required"].lower()


def test_pricing_high_inventory_liquidity_discount():
    """Surplus stock with small demand velocity encourages competitive pricing."""
    res = client.post("/api/pricing/recommend", json={
        "crop_id": 2,
        "crop_name": "Basmati Rice 1121",
        "current_price_per_kg": 90.0,
        "available_quantity_kg": 5000.0,  # very high stock
        "cost_per_kg": 60.0,
        "historical_order_count": 1,
        "historical_total_demand_kg": 20.0  # ratio = 250 -> high pressure
    })
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_price_per_kg"] < 90.0
    assert any("Inventory" in f["factor"] for f in data["factors"])


def test_pricing_scarcity_premium():
    """Low remaining stock with high order demand triggers scarcity premium."""
    res = client.post("/api/pricing/recommend", json={
        "crop_id": 3,
        "crop_name": "Nagpur Sweet Oranges",
        "current_price_per_kg": 65.0,
        "available_quantity_kg": 50.0,  # low stock
        "cost_per_kg": 40.0,
        "historical_order_count": 5,
        "historical_total_demand_kg": 100.0  # ratio = 0.5 -> scarcity
    })
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_price_per_kg"] > 65.0
    assert any("Scarcity" in f["factor"] for f in data["factors"])


# ------------------------------------------------------------------------------
# 4. Profit Intelligence Tests
# ------------------------------------------------------------------------------

def test_profit_without_cost_data():
    """When cost data is omitted, profit is marked unavailable rather than guessed."""
    res = client.post("/api/profit/analyze", json={
        "farmer_id": 1,
        "items": [
            {
                "crop_id": 1,
                "crop_name": "Organic Sharbati Wheat",
                "quantity_sold_kg": 15.0,
                "revenue": 637.50,
                "cost_per_kg": None
            }
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["total_gross_revenue"] == 637.50
    assert data["profit_available"] is False
    assert data["total_estimated_cost"] is None
    assert data["total_estimated_profit"] is None
    assert data["overall_profit_margin_percent"] is None
    assert data["crop_summaries"][0]["status"] == "COST_DATA_MISSING"
    assert "verified" in data["guidance"].lower() or "production costs" in data["guidance"].lower()


def test_profit_with_cost_data():
    """When valid cost data is provided, exact profit and margin percentages are computed."""
    res = client.post("/api/profit/analyze", json={
        "farmer_id": 1,
        "items": [
            {
                "crop_id": 1,
                "crop_name": "Organic Sharbati Wheat",
                "quantity_sold_kg": 20.0,
                "revenue": 1000.0,
                "cost_per_kg": 30.0  # cost = 600, profit = 400 (40%)
            },
            {
                "crop_id": 2,
                "crop_name": "Basmati Rice 1121",
                "quantity_sold_kg": 10.0,
                "revenue": 800.0,
                "cost_per_kg": 50.0  # cost = 500, profit = 300 (37.5%)
            }
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["total_gross_revenue"] == 1800.0
    assert data["profit_available"] is True
    assert data["total_estimated_cost"] == 1100.0
    assert data["total_estimated_profit"] == 700.0
    # 700 / 1800 = 38.89%
    assert round(data["overall_profit_margin_percent"], 2) == 38.89
    assert data["crop_summaries"][0]["status"] == "CALCULATED"
    assert data["crop_summaries"][0]["estimated_cost"] == 600.0
    assert data["crop_summaries"][0]["estimated_profit"] == 400.0
