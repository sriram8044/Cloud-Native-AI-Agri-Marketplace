"""Demand forecasting endpoints."""

from fastapi import APIRouter, HTTPException, status
from app.schemas import ForecastRequest, ForecastResponse
from app.services.forecasting import generate_demand_forecast

router = APIRouter(prefix="/api/forecast", tags=["demand-forecasting"])


@router.post(
    "/demand",
    response_model=ForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate explainable demand forecast",
    description="Forecasts future crop demand based on aggregated historical customer orders. Evaluates against a baseline and flags insufficient datasets transparently."
)
async def forecast_demand(request: ForecastRequest) -> ForecastResponse:
    try:
        return generate_demand_forecast(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting computation failed: {str(e)}"
        )
