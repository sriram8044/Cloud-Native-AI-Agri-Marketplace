"""Profit intelligence analytics ensuring strict separation of revenue, costs, and margins."""

from typing import List, Optional
from app.schemas import (
    ProfitAnalysisRequest,
    ProfitAnalysisResponse,
    CropProfitSummary,
)


def calculate_profit_analysis(request: ProfitAnalysisRequest) -> ProfitAnalysisResponse:
    """
    Compute farmer revenue, verified production costs, and profit intelligence.
    
    Guarantees:
    - Gross revenue is derived strictly from real customer transactions.
    - Production costs are NEVER inferred or fabricated from sales revenue.
    - If farmer cost data is missing, profit is explicitly flagged as unavailable.
    """
    farmer_id = request.farmer_id
    items = request.items

    total_revenue = 0.0
    total_cost_known = 0.0
    has_any_cost_data = False
    all_sold_items_have_cost = True

    crop_summaries: List[CropProfitSummary] = []

    for item in items:
        revenue = round(float(item.revenue), 2)
        total_revenue += revenue
        qty_sold = round(float(item.quantity_sold_kg), 2)
        cost_per_kg = float(item.cost_per_kg) if item.cost_per_kg is not None and item.cost_per_kg > 0 else None

        if qty_sold == 0.0:
            crop_summaries.append(CropProfitSummary(
                crop_id=item.crop_id,
                crop_name=item.crop_name,
                quantity_sold_kg=0.0,
                gross_revenue=0.0,
                cost_per_kg=cost_per_kg,
                estimated_cost=0.0 if cost_per_kg is not None else None,
                estimated_profit=0.0 if cost_per_kg is not None else None,
                profit_margin_percent=0.0 if cost_per_kg is not None else None,
                status="ZERO_SALES"
            ))
            continue

        if cost_per_kg is None:
            all_sold_items_have_cost = False
            crop_summaries.append(CropProfitSummary(
                crop_id=item.crop_id,
                crop_name=item.crop_name,
                quantity_sold_kg=qty_sold,
                gross_revenue=revenue,
                cost_per_kg=None,
                estimated_cost=None,
                estimated_profit=None,
                profit_margin_percent=None,
                status="COST_DATA_MISSING"
            ))
        else:
            has_any_cost_data = True
            item_cost = round(qty_sold * cost_per_kg, 2)
            item_profit = round(revenue - item_cost, 2)
            margin_pct = round((item_profit / revenue) * 100.0, 2) if revenue > 0 else 0.0
            total_cost_known += item_cost

            crop_summaries.append(CropProfitSummary(
                crop_id=item.crop_id,
                crop_name=item.crop_name,
                quantity_sold_kg=qty_sold,
                gross_revenue=revenue,
                cost_per_kg=cost_per_kg,
                estimated_cost=item_cost,
                estimated_profit=item_profit,
                profit_margin_percent=margin_pct,
                status="CALCULATED"
            ))

    total_revenue = round(total_revenue, 2)

    if not has_any_cost_data:
        return ProfitAnalysisResponse(
            farmer_id=farmer_id,
            total_gross_revenue=total_revenue,
            profit_available=False,
            total_estimated_cost=None,
            total_estimated_profit=None,
            overall_profit_margin_percent=None,
            crop_summaries=crop_summaries,
            guidance="Production costs have not been supplied for any listed crop. Gross sales revenue is verified from order records, but net profit cannot be computed without verified input costs."
        )

    # We have at least some cost data
    total_cost = round(total_cost_known, 2)
    # Total profit computed over items where cost is known
    # If not all items have cost, we report profit over the subset with clear notice
    revenue_of_costed_items = sum(
        s.gross_revenue for s in crop_summaries if s.estimated_cost is not None
    )
    total_profit = round(revenue_of_costed_items - total_cost, 2)
    overall_margin = round((total_profit / revenue_of_costed_items) * 100.0, 2) if revenue_of_costed_items > 0 else 0.0

    guidance_msg = (
        "Net profit calculated strictly from farmer-supplied production costs. "
        "Costs were never guessed or inferred from sales revenue."
    )
    if not all_sold_items_have_cost:
        guidance_msg += " Note: Some crops are missing cost per kg; totals reflect only items with verified cost data."

    return ProfitAnalysisResponse(
        farmer_id=farmer_id,
        total_gross_revenue=total_revenue,
        profit_available=True,
        total_estimated_cost=total_cost,
        total_estimated_profit=total_profit,
        overall_profit_margin_percent=overall_margin,
        crop_summaries=crop_summaries,
        guidance=guidance_msg
    )
