"""Dynamic pricing recommendation endpoints."""

from fastapi import APIRouter, HTTPException, status
from app.schemas import PriceRecommendationRequest, PriceRecommendationResponse
from app.services.pricing import calculate_price_recommendation

router = APIRouter(prefix="/api/pricing", tags=["dynamic-pricing"])


@router.post(
    "/recommend",
    response_model=PriceRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate explainable price recommendation",
    description="Calculates a recommended price range and suggested price considering current stock, demand velocity, and optional farmer cost floor."
)
async def recommend_pricing(request: PriceRecommendationRequest) -> PriceRecommendationResponse:
    try:
        return calculate_price_recommendation(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pricing recommendation failed: {str(e)}"
        )
