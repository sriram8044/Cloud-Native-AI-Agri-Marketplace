"""Pydantic schemas for AI Service requests and responses."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ------------------------------------------------------------------------------
# Health Check Schema
# ------------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime


from pydantic import BaseModel, Field, field_validator
from typing import Any, List, Optional


# ------------------------------------------------------------------------------
# Demand Forecasting Schemas
# ------------------------------------------------------------------------------

class HistoricalOrderRecord(BaseModel):
    order_date: datetime
    quantity_kg: float = Field(ge=0.0, description="Quantity ordered in kilograms")
    price_per_kg: Optional[float] = Field(default=None, ge=0.0, description="Sold price per kg")

    @field_validator("order_date", mode="before")
    @classmethod
    def parse_order_date(cls, v: Any) -> Any:
        if isinstance(v, (list, tuple)):
            year, month, day = v[0], v[1], v[2]
            hour = v[3] if len(v) > 3 else 0
            minute = v[4] if len(v) > 4 else 0
            second = v[5] if len(v) > 5 else 0
            return datetime(year, month, day, hour, minute, second)
        return v


class ForecastRequest(BaseModel):
    crop_id: int = Field(gt=0, description="Crop listing ID")
    crop_name: str = Field(min_length=1, description="Crop name")
    historical_orders: List[HistoricalOrderRecord] = Field(
        default_factory=list,
        description="Historical customer order transactions (PLACED/CONFIRMED/DELIVERED, non-cancelled)"
    )
    horizon_days: int = Field(default=7, ge=1, le=90, description="Forecast horizon in days")
    aggregation_interval: str = Field(default="daily", description="Aggregation granularity (daily/weekly)")


class DemandForecastPoint(BaseModel):
    date: str
    predicted_demand_kg: float
    is_fallback: bool = False


class ModelEvaluationMetrics(BaseModel):
    name: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    sample_size: int = 0
    description: str


class ForecastResponse(BaseModel):
    crop_id: int
    crop_name: str
    status: str  # "SUFFICIENT_DATA" | "INSUFFICIENT_DATA"
    has_sufficient_data: bool
    historical_points_count: int
    minimum_points_required: int
    forecast_horizon_days: int
    forecast: List[DemandForecastPoint]
    baseline_model: ModelEvaluationMetrics
    evaluated_model: ModelEvaluationMetrics
    data_limitations: List[str]


# ------------------------------------------------------------------------------
# Explainable Dynamic Pricing Schemas
# ------------------------------------------------------------------------------

class PriceRecommendationRequest(BaseModel):
    crop_id: int = Field(gt=0)
    crop_name: str = Field(min_length=1)
    current_price_per_kg: float = Field(gt=0.0, description="Current listed price in INR")
    available_quantity_kg: float = Field(ge=0.0, description="Current stock in kg")
    cost_per_kg: Optional[float] = Field(default=None, ge=0.0, description="Farmer production cost per kg")
    historical_order_count: int = Field(default=0, ge=0)
    historical_total_demand_kg: float = Field(default=0.0, ge=0.0)
    forecast_demand_kg: Optional[float] = Field(default=None, ge=0.0)
    forecast_confidence: Optional[str] = Field(default="NONE")  # "NONE" | "LOW" | "MODERATE" | "HIGH"


class PriceRange(BaseModel):
    min_price_per_kg: float
    max_price_per_kg: float


class PricingFactor(BaseModel):
    factor: str
    impact: str  # "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "PROTECTIVE"
    description: str


class PriceRecommendationResponse(BaseModel):
    crop_id: int
    crop_name: str
    current_price_per_kg: float
    suggested_price_per_kg: float
    price_range: PriceRange
    methodology: str  # e.g. "EXPLAINABLE_RULE_ENGINE" or "HYBRID_ML_RULE"
    factors: List[PricingFactor]
    action_required: str = "Farmer review required. Prices will NOT be modified automatically."


# ------------------------------------------------------------------------------
# Profit Intelligence Schemas
# ------------------------------------------------------------------------------

class ProfitItemInput(BaseModel):
    crop_id: int = Field(gt=0)
    crop_name: str = Field(min_length=1)
    quantity_sold_kg: float = Field(ge=0.0)
    revenue: float = Field(ge=0.0)
    cost_per_kg: Optional[float] = Field(default=None, ge=0.0)


class ProfitAnalysisRequest(BaseModel):
    farmer_id: int = Field(gt=0)
    items: List[ProfitItemInput] = Field(default_factory=list)


class CropProfitSummary(BaseModel):
    crop_id: int
    crop_name: str
    quantity_sold_kg: float
    gross_revenue: float
    cost_per_kg: Optional[float]
    estimated_cost: Optional[float]
    estimated_profit: Optional[float]
    profit_margin_percent: Optional[float]
    status: str  # "CALCULATED" | "COST_DATA_MISSING" | "ZERO_SALES"


class ProfitAnalysisResponse(BaseModel):
    farmer_id: int
    total_gross_revenue: float
    profit_available: bool
    total_estimated_cost: Optional[float]
    total_estimated_profit: Optional[float]
    overall_profit_margin_percent: Optional[float]
    crop_summaries: List[CropProfitSummary]
    guidance: str
