"""FastAPI Application Entry Point for Cloud-Native AI Agri Marketplace AI Service."""

from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.schemas import HealthResponse
from app.routers import forecast, pricing, profit

app = FastAPI(
    title="Cloud-Native AI Agri Marketplace - AI Service",
    description="Explainable Demand Forecasting, Dynamic Pricing Recommendations, and Profit Intelligence.",
    version=__version__,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# Enable CORS for internal microservice communication and browser direct inspection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(forecast.router)
app.include_router(pricing.router)
app.include_router(profit.router)


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Service health check endpoint."""
    return HealthResponse(
        status="UP",
        service="agri-ai-service",
        version=__version__,
        timestamp=datetime.now(),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
