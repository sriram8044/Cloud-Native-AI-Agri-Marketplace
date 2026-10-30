"""Explainable dynamic pricing service distinguishing rule heuristics from ML models."""

from typing import List
from app.schemas import (
    PriceRecommendationRequest,
    PriceRecommendationResponse,
    PriceRange,
    PricingFactor,
)


def calculate_price_recommendation(request: PriceRecommendationRequest) -> PriceRecommendationResponse:
    """
    Calculate an explainable price recommendation.
    
    Guarantees:
    - Transparently labeled methodology: EXPLAINABLE_RULE_ENGINE or HYBRID_ML_RULE.
    - Explicit factors explaining every adjustment.
    - Strict protection of farmer cost floor when cost_per_kg is supplied.
    - Informational only: Never alters prices automatically.
    """
    crop_id = request.crop_id
    crop_name = request.crop_name
    current_price = round(float(request.current_price_per_kg), 2)
    stock_kg = float(request.available_quantity_kg)
    cost_per_kg = float(request.cost_per_kg) if request.cost_per_kg is not None else None
    hist_orders = request.historical_order_count
    hist_demand = float(request.historical_total_demand_kg)
    forecast_demand = float(request.forecast_demand_kg) if request.forecast_demand_kg is not None else None
    confidence = (request.forecast_confidence or "NONE").upper()

    factors: List[PricingFactor] = []
    price_adjustments_pct = 0.0

    # 1. Cost Floor Analysis (Protective Factor)
    min_allowable_price = 1.0  # absolute bottom limit
    if cost_per_kg is not None and cost_per_kg > 0:
        cost_floor = round(cost_per_kg * 1.15, 2)  # Target at least 15% operating margin
        min_allowable_price = cost_floor
        
        if current_price < cost_floor:
            # Underpriced relative to cost
            deficit_pct = round(((cost_floor - current_price) / current_price) * 100, 1)
            price_adjustments_pct += max(5.0, deficit_pct)
            factors.append(PricingFactor(
                factor="Production Cost Protection",
                impact="PROTECTIVE",
                description=f"Current price (₹{current_price}) is below recommended 15% cost margin floor (₹{cost_floor:.2f} based on ₹{cost_per_kg:.2f}/kg cost). Upward correction advised."
            ))
        else:
            current_margin = round(((current_price - cost_per_kg) / current_price) * 100, 1)
            factors.append(PricingFactor(
                factor="Healthy Cost Coverage",
                impact="POSITIVE",
                description=f"Current price sustains a healthy {current_margin}% gross margin over stated cost of ₹{cost_per_kg:.2f}/kg."
            ))
    else:
        factors.append(PricingFactor(
            factor="Cost Baseline",
            impact="NEUTRAL",
            description="No production cost per kg supplied. Margin floor cannot be verified; price elasticity estimated from market demand."
        ))

    # 2. Inventory Liquidity & Velocity (Supply Pressure)
    # Ratio of available stock to historical sales
    if hist_demand > 0 and stock_kg > 0:
        stock_to_demand_ratio = stock_kg / hist_demand
        if stock_to_demand_ratio > 20.0:
            # Heavy surplus stock compared to past orders
            price_adjustments_pct -= 4.0
            factors.append(PricingFactor(
                factor="High Inventory Pressure",
                impact="NEGATIVE",
                description=f"Remaining inventory ({stock_kg:,.0f} kg) is high relative to historical order velocity ({hist_demand:,.0f} kg). A competitive price encourages faster liquidation."
            ))
        elif stock_to_demand_ratio < 2.0:
            # Scarcity / low stock
            price_adjustments_pct += 5.0
            factors.append(PricingFactor(
                factor="Inventory Scarcity",
                impact="POSITIVE",
                description=f"Low remaining inventory ({stock_kg:,.0f} kg) with proven demand indicates scarcity, supporting a premium price."
            ))
        else:
            factors.append(PricingFactor(
                factor="Balanced Inventory Ratio",
                impact="NEUTRAL",
                description=f"Stock of {stock_kg:,.0f} kg is aligned with current demand turnover ({hist_demand:,.0f} kg)."
            ))
    elif stock_kg > 2000.0 and hist_orders == 0:
        # Large stock with zero orders
        price_adjustments_pct -= 3.0
        factors.append(PricingFactor(
            factor="Unsold Initial Inventory",
            impact="NEGATIVE",
            description=f"Substantial stock ({stock_kg:,.0f} kg) with no order history. A promotional introductory rate can spur initial buyer engagement."
        ))
    else:
        factors.append(PricingFactor(
            factor="Stable Stock Velocity",
            impact="NEUTRAL",
            description=f"Listing quantity ({stock_kg:,.0f} kg) maintains normal market exposure."
        ))

    # 3. Forecast Demand Trajectory
    is_ml_driven = False
    if forecast_demand is not None and confidence in ["MODERATE", "HIGH"]:
        is_ml_driven = True
        # Compare forecast demand with historical velocity
        avg_hist_daily = hist_demand / max(1, hist_orders)
        if forecast_demand > avg_hist_daily * 1.2:
            price_adjustments_pct += 4.0
            factors.append(PricingFactor(
                factor="Validated Demand Upsurge",
                impact="POSITIVE",
                description=f"Validated demand forecast projects an increase to {forecast_demand:.1f} kg, justifying a moderate price enhancement."
            ))
        elif forecast_demand < avg_hist_daily * 0.8:
            price_adjustments_pct -= 3.0
            factors.append(PricingFactor(
                factor="Anticipated Demand Softening",
                impact="NEGATIVE",
                description=f"Validated forecast suggests softer near-term demand ({forecast_demand:.1f} kg), recommending attractive pricing."
            ))
    elif hist_orders > 0:
        factors.append(PricingFactor(
            factor="Historical Order Traction",
            impact="POSITIVE",
            description=f"{hist_orders} completed order(s) totaling {hist_demand:,.1f} kg confirm positive buyer acceptance at current price levels."
        ))

    # 4. Cap Total Adjustment to Safe Range (-12% to +15%)
    clamped_adjustment = max(-12.0, min(15.0, price_adjustments_pct))
    raw_suggested = current_price * (1.0 + (clamped_adjustment / 100.0))

    # Apply cost floor guarantee
    if cost_per_kg is not None and cost_per_kg > 0:
        raw_suggested = max(raw_suggested, min_allowable_price)

    suggested_price = round(raw_suggested, 2)

    # 5. Determine Recommended Price Band (+/- 8% around suggested, bounded by cost floor)
    band_half_width = max(1.5, round(suggested_price * 0.08, 2))
    min_range = round(max(min_allowable_price, suggested_price - band_half_width), 2)
    max_range = round(suggested_price + band_half_width, 2)

    methodology = "HYBRID_ML_RULE" if is_ml_driven else "EXPLAINABLE_RULE_ENGINE"

    return PriceRecommendationResponse(
        crop_id=crop_id,
        crop_name=crop_name,
        current_price_per_kg=current_price,
        suggested_price_per_kg=suggested_price,
        price_range=PriceRange(
            min_price_per_kg=min_range,
            max_price_per_kg=max_range,
        ),
        methodology=methodology,
        factors=factors,
        action_required="Farmer review required. Prices will NOT be modified automatically."
    )
