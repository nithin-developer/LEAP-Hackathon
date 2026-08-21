import json
import logging
from datetime import datetime, timedelta
import requests
from app.config import settings
from app.schemas.harvest_intelligence import (
    HarvestAnalysisRequest,
    HarvestAnalysisResponse,
    RecommendationDetail,
    CropAnalysisDetail,
    TransportAnalysisDetail,
    MarketAnalysisDetail,
    OpportunityScoreDetail,
    TimelineStageDetail,
    RiskAnalysisDetail,
    HarvestWindowPoint,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are an AI agricultural harvest-timing assistant.

Your job is to determine the optimal harvest time for a crop so that it reaches
the destination in the best commercial condition while maximizing farmer value.

You will receive:
- Crop image (if provided)
- Crop/variety name and category (FRUIT, GRAIN, PULSE, OILSEED)
- Current date/time
- Estimated transport time
- Destination market
- Weather/environment information
- Current market price
- Expected market price
- Optional farmer observations

IMPORTANT RULES:
1. Analyze the crop image for visible maturity indicators: color, size, shape, surface characteristics, visible defects, maturity stage, pod drying, or grain fill.
2. Consider the crop's normal post-harvest ripening behavior or moisture loss. Do NOT assume every crop ripens at the same rate.
3. Consider transportation time and environmental conditions.
4. The target is NOT automatically "fully ripe". Determine the commercially optimal maturity stage for the destination.
5. If the crop is currently too immature: recommend how long the farmer should wait before harvesting.
6. If the crop is already at the optimal stage: recommend harvesting now.
7. If the crop is already too mature: recommend harvesting immediately and explain the risk.
8. Never invent exact biological measurements that cannot be determined from the image.
9. Market data should influence the recommendation economically.
10. Give ONE primary recommendation. Do not provide multiple contradictory interpretations.
11. Do not expose internal reasoning, chain-of-thought, or hidden analysis (no <think> tags).
12. Return ONLY valid JSON matching the schema below.

JSON SCHEMA:
{
  "recommendation": {
    "action": "HARVEST_NOW | WAIT",
    "recommended_harvest_date": "YYYY-MM-DD",
    "recommended_harvest_time": "HH:MM",
    "wait_days": 0,
    "target_arrival_date": "YYYY-MM-DD",
    "target_arrival_time": "HH:MM",
    "target_maturity": "Market-ready | Commercial green | Peak ripeness | Dry grain",
    "confidence": 85,
    "summary": "string"
  },
  "crop_analysis": {
    "crop": "string",
    "variety": "string",
    "category": "FRUIT | GRAIN | PULSE | OILSEED",
    "current_maturity_stage": "string",
    "estimated_ripeness": 78,
    "estimated_moisture": 15.0,
    "visual_indicators": ["string"]
  },
  "transport_analysis": {
    "transport_hours": 28.0,
    "arrival_condition": "string",
    "transport_risk": "LOW | MEDIUM | HIGH"
  },
  "market_analysis": {
    "current_price": 85.0,
    "expected_price": 102.0,
    "price_change_percent": 20.0,
    "market_trend": "RISING | STABLE | FALLING",
    "economic_recommendation": "string"
  },
  "risk_analysis": {
    "early_harvest_risk": "string",
    "late_harvest_risk": "string",
    "transport_risk": "string",
    "rain_risk": "string"
  },
  "decision_factors": ["string"],
  "farmer_action": ["string"]
}
"""

def call_groq_vision(request: HarvestAnalysisRequest) -> dict | None:
    """Invokes Groq API with system prompt and crop data."""
    if not settings.GROQ_API_KEY:
        logger.warning("No GROQ_API_KEY configured. Falling back to heuristic model.")
        return None

    try:
        user_prompt_content = f"""
Analyze this crop for commercial harvest timing.

CROP: {request.crop_name}
VARIETY: {request.variety}
CATEGORY: {request.crop_category}
CURRENT DATE: {request.current_date or datetime.now().strftime('%Y-%m-%d')}
TRANSPORT: {request.transport_hours} hours
DESTINATION: {request.destination_mandi}

TARGET:
The crop should arrive at the market at the optimal commercial maturity stage for selling.
It should not arrive overripe, damaged, or wet/spoiled.

MARKET DATA:
Current price: ₹{request.current_price}/unit
Expected price in {request.expected_price_days} days: ₹{request.expected_price}/unit

WEATHER:
Temperature: {request.temperature}°C
Humidity: {request.humidity}%
Rain forecast: {request.rain_forecast}

FARMER NOTES:
{request.notes or 'None'}

Provide the best single harvest recommendation in valid JSON.
"""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]

        if request.image_base64 and request.image_base64.startswith("data:image"):
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt_content},
                    {"type": "image_url", "image_url": {"url": request.image_base64}}
                ]
            })
        else:
            messages.append({"role": "user", "content": user_prompt_content})

        # Active Groq Models
        models_to_try = [
            "openai/gpt-oss-120b",
            "qwen/qwen3.6-27b",
            "groq/compound-mini"
        ]

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        for model_name in models_to_try:
            try:
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
                res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=15
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    # Clean any accidental code block markers
                    cleaned = content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    parsed = json.loads(cleaned)
                    return parsed
                else:
                    logger.warning(f"Groq model {model_name} failed with code {res.status_code}: {res.text}")
            except Exception as e:
                logger.warning(f"Error calling model {model_name}: {e}")

    except Exception as err:
        logger.error(f"Groq API vision call failed: {err}")
    
    return None

def generate_heuristic_analysis(request: HarvestAnalysisRequest) -> dict:
    """Fallback agricultural decision logic when API key is unavailable or fails."""
    today = datetime.now()
    base_date = datetime.strptime(request.current_date, "%Y-%m-%d") if request.current_date else today

    category = request.crop_category.upper()
    crop_lower = request.crop_name.lower()

    # Determine wait days & maturity baseline based on crop category & price trend
    price_diff = request.expected_price - request.current_price
    price_change_pct = (price_diff / request.current_price * 100) if request.current_price > 0 else 0.0
    
    if category == "GRAIN" or "wheat" in crop_lower or "rice" in crop_lower or "maize" in crop_lower:
        wait_days = 2 if request.rain_forecast == "LOW" and price_change_pct > 5 else (0 if request.rain_forecast == "HIGH" else 1)
        curr_stage = "Mature Grain (Hard Dough Stage)" if wait_days == 0 else "Golden Grain (Field Drying)"
        ripeness = 91 if wait_days == 0 else 84
        moisture = 14.5 if wait_days == 0 else 16.8
        visuals = ["Golden yellow husks", "Kernels firm under pressure", "Low moisture indication", "Panicles fully turned"]
        arrival_cond = "Optimal Moisture Grain"
        early_risk = "High moisture content requiring artificial mechanical drying."
        late_risk = "Rain lodging risk and excessive grain shattering loss."
    elif category == "PULSE" or "chickpea" in crop_lower or "gram" in crop_lower or "pea" in crop_lower:
        wait_days = 2 if price_change_pct > 10 else 1
        curr_stage = "Pod Maturity Phase"
        ripeness = 86
        moisture = 13.8
        visuals = ["Pods drying to straw color", "Seeds rattling inside pods", "Leaves yellowing"]
        arrival_cond = "Market-ready Dry Pulse"
        early_risk = "Unripe green seeds reducing market quality grade."
        late_risk = "Pod splitting and field insect infestation."
    else:  # FRUIT or default
        wait_days = 3 if price_change_pct > 12 else (2 if price_change_pct > 0 else 0)
        curr_stage = "Mature Green (Shoulders filled)" if wait_days > 0 else "Color Turning Stage"
        ripeness = 78 if wait_days > 0 else 92
        moisture = 85.0
        visuals = ["Full shoulder development", "Dark green to light blush transition", "Firm skin texture", "Latent latex reduction"]
        arrival_cond = "Commercially Market-Ready"
        early_risk = "Fruit may arrive under-developed with uneven latex ripening."
        late_risk = "Fruit over-ripening during 28h transit causing bruising & spoilage."

    rec_harvest_date = (base_date + timedelta(days=wait_days)).strftime("%Y-%m-%d")
    target_arrival_date = (base_date + timedelta(days=wait_days + int(request.transport_hours // 24) + 1)).strftime("%Y-%m-%d")

    action = "WAIT" if wait_days > 0 else "HARVEST_NOW"
    summary = f"Wait {wait_days} days to harvest early morning on {rec_harvest_date} at 06:00 AM. Arrives at {request.destination_mandi} in market-ready condition with maximum commercial value." if wait_days > 0 else f"Harvest immediately on {rec_harvest_date} at 06:00 AM to prevent transit over-ripening and spoilage."

    return {
        "recommendation": {
            "action": action,
            "recommended_harvest_date": rec_harvest_date,
            "recommended_harvest_time": "06:00",
            "wait_days": wait_days,
            "target_arrival_date": target_arrival_date,
            "target_arrival_time": "10:00",
            "target_maturity": arrival_cond,
            "confidence": 88,
            "summary": summary
        },
        "crop_analysis": {
            "crop": request.crop_name,
            "variety": request.variety,
            "category": category,
            "current_maturity_stage": curr_stage,
            "estimated_ripeness": ripeness,
            "estimated_moisture": moisture,
            "visual_indicators": visuals
        },
        "transport_analysis": {
            "transport_hours": request.transport_hours,
            "arrival_condition": arrival_cond,
            "transport_risk": "LOW" if request.transport_hours <= 36 else "MEDIUM"
        },
        "market_analysis": {
            "current_price": request.current_price,
            "expected_price": request.expected_price,
            "price_change_percent": round(price_change_pct, 1),
            "market_trend": "RISING" if price_change_pct > 2 else ("FALLING" if price_change_pct < -2 else "STABLE"),
            "economic_recommendation": f"Waiting {wait_days} days aligns with a {round(price_change_pct, 1)}% projected market price increase." if wait_days > 0 else "Harvesting now locks in current peak price."
        },
        "risk_analysis": {
            "early_harvest_risk": early_risk,
            "late_harvest_risk": late_risk,
            "transport_risk": f"Low risk over {request.transport_hours}h transit if shade packed.",
            "rain_risk": f"{request.rain_forecast.title()} risk of rainfall impact during field drying."
        },
        "decision_factors": [
            f"Crop is currently at {ripeness}% commercial maturity",
            f"Estimated transit duration to {request.destination_mandi} is {request.transport_hours}h",
            f"Market price expected to shift by {round(price_change_pct, 1)}%",
            f"Weather forecast indicates {request.rain_forecast} rain risk",
            f"Predicted arrival condition: {arrival_cond}"
        ],
        "farmer_action": [
            f"Schedule harvest for {rec_harvest_date} around 06:00 AM",
            "Keep crop shaded immediately post-harvest",
            "Grade and remove visibly blemished units before crate loading",
            "Dispatch transport vehicle within 2 hours of harvest"
        ]
    }

def process_harvest_intelligence(request: HarvestAnalysisRequest) -> HarvestAnalysisResponse:
    """Processes crop harvest intelligence request combining AI Vision / LLM and deterministic business engines."""
    
    # 1. Try Groq Vision API first if key available
    ai_raw = call_groq_vision(request)
    
    # 2. Fallback to heuristic agricultural logic if AI call fails or is unavailable
    if not ai_raw:
        ai_raw = generate_heuristic_analysis(request)

    # Standardize AI output with deterministic calculations
    rec_data = ai_raw.get("recommendation", {})
    crop_data = ai_raw.get("crop_analysis", {})
    trans_data = ai_raw.get("transport_analysis", {})
    mkt_data = ai_raw.get("market_analysis", {})
    risk_data = ai_raw.get("risk_analysis", {})

    # Calculate deterministic market price metrics
    curr_p = request.current_price
    exp_p = request.expected_price
    price_change_pct = round(((exp_p - curr_p) / curr_p * 100), 1) if curr_p > 0 else 0.0
    extra_val = round(max(0.0, exp_p - curr_p), 2)
    mkt_trend = "RISING" if price_change_pct > 2 else ("FALLING" if price_change_pct < -2 else "STABLE")

    # Calculate deterministic Opportunity Scores
    mat_score = int(crop_data.get("estimated_ripeness") or 78)
    mkt_score = min(100, max(40, int(50 + price_change_pct * 2)))
    trans_score = min(100, max(30, int(100 - request.transport_hours * 1.2)))
    spoil_score = int(30 + (100 - mat_score) * 0.2 + (request.transport_hours * 0.4))

    overall_score = int(round(mat_score * 0.35 + mkt_score * 0.30 + trans_score * 0.25 - spoil_score * 0.10))
    overall_score = max(10, min(99, overall_score))

    if overall_score >= 80:
        grade = "EXCELLENT"
    elif overall_score >= 65:
        grade = "GOOD"
    elif overall_score >= 50:
        grade = "MODERATE"
    else:
        grade = "POOR"

    opportunity_score = OpportunityScoreDetail(
        overall_score=overall_score,
        grade=grade,
        crop_maturity_score=mat_score,
        market_opportunity_score=mkt_score,
        transport_safety_score=trans_score,
        spoilage_risk_score=spoil_score
    )

    # Build 28-Hour Journey Timeline
    harvest_date_str = rec_data.get("recommended_harvest_date", datetime.now().strftime("%Y-%m-%d"))
    try:
        h_date = datetime.strptime(harvest_date_str, "%Y-%m-%d")
    except Exception:
        h_date = datetime.now()

    t_hours = request.transport_hours
    journey_timeline = [
        TimelineStageDetail(
            stage="HARVEST",
            title="🌳 Field Harvest",
            date=h_date.strftime("%b %d, %Y"),
            time="06:00 AM",
            description=f"Harvest at optimal commercial stage ({rec_data.get('target_maturity', 'Optimal')}).",
            status="RECOMMENDED"
        ),
        TimelineStageDetail(
            stage="COLLECTION",
            title="📦 Shaded Sorting & Crating",
            date=h_date.strftime("%b %d, %Y"),
            time="02:00 PM",
            description="Grade, pack in ventilated crates, and store in shaded collection hub.",
            status="PENDING"
        ),
        TimelineStageDetail(
            stage="TRANSPORT",
            title="🚚 Logistics Dispatch",
            date=h_date.strftime("%b %d, %Y"),
            time="06:00 PM",
            description=f"{t_hours}h transit to {request.destination_mandi} under controlled ventilation.",
            status="PENDING"
        ),
        TimelineStageDetail(
            stage="MANDI",
            title=f"🏪 Arrival at {request.destination_mandi}",
            date=(h_date + timedelta(days=1)).strftime("%b %d, %Y"),
            time="10:00 AM",
            description=f"Expected Condition: 🟢 {rec_data.get('target_maturity', 'Market-ready')}.",
            status="TARGET"
        )
    ]

    # Build Harvest Window Chart data points (-1 to +4 days)
    chart_points = []
    base_mat = int(crop_data.get("estimated_ripeness") or 75)
    rec_wait = int(rec_data.get("wait_days") or 2)

    for offset in range(0, 6):
        pt_date = (h_date - timedelta(days=rec_wait) + timedelta(days=offset)).strftime("%b %d")
        pt_mat = min(100, max(20, base_mat + offset * 6))
        pt_spoil = min(100, max(5, int(10 + max(0, offset - rec_wait) * 18)))
        pt_price = round(curr_p + (price_change_pct / 5.0) * offset * (curr_p / 100.0), 2)
        
        if offset < rec_wait:
            pt_status = "TOO EARLY"
        elif offset == rec_wait:
            pt_status = "OPTIMAL WINDOW"
        else:
            pt_status = "OVERRIPE RISK"

        chart_points.append(HarvestWindowPoint(
            day_offset=offset,
            date=pt_date,
            maturity_percent=pt_mat,
            spoilage_risk_percent=pt_spoil,
            market_value=pt_price,
            status=pt_status
        ))

    return HarvestAnalysisResponse(
        recommendation=RecommendationDetail(
            action=rec_data.get("action") or "WAIT",
            recommended_harvest_date=harvest_date_str,
            recommended_harvest_time=rec_data.get("recommended_harvest_time") or "06:00",
            wait_days=int(rec_data.get("wait_days") or 2),
            target_arrival_date=rec_data.get("target_arrival_date") or (h_date + timedelta(days=1)).strftime("%Y-%m-%d"),
            target_arrival_time=rec_data.get("target_arrival_time") or "10:00",
            target_maturity=rec_data.get("target_maturity") or "Market-ready",
            confidence=int(rec_data.get("confidence") or 86),
            summary=rec_data.get("summary") or "Harvest at recommended date for optimal commercial value."
        ),
        crop_analysis=CropAnalysisDetail(
            crop=request.crop_name,
            variety=request.variety,
            category=request.crop_category,
            current_maturity_stage=crop_data.get("current_maturity_stage") or "Commercial Maturity",
            estimated_ripeness=int(crop_data.get("estimated_ripeness") or 78),
            estimated_moisture=float(crop_data.get("estimated_moisture") or 15.0),
            visual_indicators=crop_data.get("visual_indicators") or ["Firm texture", "Color transition"]
        ),
        transport_analysis=TransportAnalysisDetail(
            transport_hours=request.transport_hours,
            arrival_condition=rec_data.get("target_maturity") or "Market-ready",
            transport_risk=trans_data.get("transport_risk") or "LOW"
        ),
        market_analysis=MarketAnalysisDetail(
            current_price=curr_p,
            expected_price=exp_p,
            price_change_percent=price_change_pct,
            market_trend=mkt_trend,
            economic_recommendation=mkt_data.get("economic_recommendation") or f"Waiting aligns with projected {price_change_pct}% value gain.",
            estimated_extra_value_per_unit=extra_val
        ),
        opportunity_score=opportunity_score,
        journey_timeline=journey_timeline,
        risk_analysis=RiskAnalysisDetail(
            early_harvest_risk=risk_data.get("early_harvest_risk") or "Lower quality grade upon arrival.",
            late_harvest_risk=risk_data.get("late_harvest_risk") or "Higher spoilage and soft bruising in transit.",
            transport_risk=risk_data.get("transport_risk") or "Low risk under standard ventilation.",
            rain_risk=risk_data.get("rain_risk") or f"{request.rain_forecast} risk of rain during harvest."
        ),
        decision_factors=ai_raw.get("decision_factors") or [
            f"Crop is at {crop_data.get('estimated_ripeness') or 78}% maturity stage",
            f"Transport time is {request.transport_hours} hours to {request.destination_mandi}",
            f"Expected market value gain of +{price_change_pct}%",
            "Low risk of field degradation"
        ],
        farmer_action=ai_raw.get("farmer_action") or [
            f"Harvest on {harvest_date_str} at 06:00 AM",
            "Keep crop shaded post-harvest",
            "Dispatch within 2 hours"
        ],
        harvest_window_chart=chart_points
    )
