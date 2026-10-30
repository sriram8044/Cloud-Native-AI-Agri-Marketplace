"""Profit intelligence endpoints."""

from fastapi import APIRouter, HTTPException, status
from app.schemas import ProfitAnalysisRequest, ProfitAnalysisResponse
from app.services.profit import calculate_profit_analysis

router = APIRouter(prefix="/api/profit", tags=["profit-intelligence"])


@router.post(
    "/analyze",
    response_model=ProfitAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute verified profit intelligence",
    description="Calculates gross revenue, verified production costs, and profit margins. Strictly forbids inferring costs from sales revenue."
)
async def analyze_profit(request: ProfitAnalysisRequest) -> ProfitAnalysisResponse:
    try:
        return calculate_profit_analysis(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profit analysis failed: {str(e)}"
        )
