from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.schemas.harvest_intelligence import HarvestAnalysisRequest, HarvestAnalysisResponse
from app.services.harvest_engine import process_harvest_intelligence
from app.security import require_role

router = APIRouter()

@router.post(
    "/harvest-intelligence/analyze",
    response_model=HarvestAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze crop maturity and determine optimal harvest timing"
)
async def analyze_crop_harvest(
    request: HarvestAnalysisRequest,
    user: User = Depends(require_role("farmer")),
):
    """
    Analyzes crop parameters, image, weather, transit duration, and market prices
    to provide a structured agricultural harvest recommendation for farmers.
    """
    try:
        response = process_harvest_intelligence(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing harvest analysis: {str(e)}"
        )
