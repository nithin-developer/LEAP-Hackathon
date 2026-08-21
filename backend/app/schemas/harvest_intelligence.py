from typing import List, Optional
from pydantic import BaseModel, Field

class HarvestAnalysisRequest(BaseModel):
    crop_category: str = Field(default="FRUIT", description="FRUIT, GRAIN, PULSE, OILSEED")
    crop_name: str = Field(..., description="Crop name e.g. Mango, Wheat, Tomato")
    variety: str = Field(default="Standard", description="Crop variety e.g. Alphonso, Sharbati")
    current_date: Optional[str] = Field(default=None, description="Current date YYYY-MM-DD")
    transport_hours: float = Field(default=28.0, description="Transit duration in hours")
    destination_mandi: str = Field(default="Local Mandi", description="Destination market name")
    current_price: float = Field(default=85.0, description="Current market price per kg/qtl")
    expected_price: float = Field(default=102.0, description="Expected market price")
    expected_price_days: int = Field(default=3, description="Days for expected price")
    temperature: float = Field(default=29.0, description="Ambient temperature in °C")
    humidity: float = Field(default=72.0, description="Humidity percentage")
    rain_forecast: str = Field(default="LOW", description="LOW, MEDIUM, HIGH")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded image string")
    notes: Optional[str] = Field(default=None, description="Optional farmer observations")

class RecommendationDetail(BaseModel):
    action: str  # HARVEST_NOW | WAIT
    recommended_harvest_date: str
    recommended_harvest_time: str
    wait_days: int
    target_arrival_date: str
    target_arrival_time: str
    target_maturity: str
    confidence: int
    summary: str

class CropAnalysisDetail(BaseModel):
    crop: str
    variety: str
    category: str
    current_maturity_stage: str
    estimated_ripeness: int  # 0 to 100
    estimated_moisture: float  # Moisture % for grains/pulses
    visual_indicators: List[str]

class TransportAnalysisDetail(BaseModel):
    transport_hours: float
    arrival_condition: str
    transport_risk: str  # LOW | MEDIUM | HIGH

class MarketAnalysisDetail(BaseModel):
    current_price: float
    expected_price: float
    price_change_percent: float
    market_trend: str  # RISING | STABLE | FALLING
    economic_recommendation: str
    estimated_extra_value_per_unit: float

class OpportunityScoreDetail(BaseModel):
    overall_score: int  # 0 to 100
    grade: str  # EXCELLENT | GOOD | MODERATE | POOR
    crop_maturity_score: int
    market_opportunity_score: int
    transport_safety_score: int
    spoilage_risk_score: int

class TimelineStageDetail(BaseModel):
    stage: str
    title: str
    time: str
    date: str
    description: str
    status: str

class RiskAnalysisDetail(BaseModel):
    early_harvest_risk: str
    late_harvest_risk: str
    transport_risk: str
    rain_risk: str

class HarvestWindowPoint(BaseModel):
    day_offset: int
    date: str
    maturity_percent: int
    spoilage_risk_percent: int
    market_value: float
    status: str

class HarvestAnalysisResponse(BaseModel):
    recommendation: RecommendationDetail
    crop_analysis: CropAnalysisDetail
    transport_analysis: TransportAnalysisDetail
    market_analysis: MarketAnalysisDetail
    opportunity_score: OpportunityScoreDetail
    journey_timeline: List[TimelineStageDetail]
    risk_analysis: RiskAnalysisDetail
    decision_factors: List[str]
    farmer_action: List[str]
    harvest_window_chart: List[HarvestWindowPoint]
