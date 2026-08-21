import { apiClient } from "@/api/http";

export interface HarvestAnalysisRequest {
  crop_category: "FRUIT" | "GRAIN" | "PULSE" | "OILSEED";
  crop_name: string;
  variety: string;
  current_date?: string;
  transport_hours: number;
  destination_mandi: string;
  current_price: number;
  expected_price: number;
  expected_price_days: number;
  temperature: number;
  humidity: number;
  rain_forecast: "LOW" | "MEDIUM" | "HIGH";
  image_base64?: string;
  notes?: string;
}

export interface RecommendationDetail {
  action: "HARVEST_NOW" | "WAIT";
  recommended_harvest_date: string;
  recommended_harvest_time: string;
  wait_days: number;
  target_arrival_date: string;
  target_arrival_time: string;
  target_maturity: string;
  confidence: number;
  summary: string;
}

export interface CropAnalysisDetail {
  crop: string;
  variety: string;
  category: string;
  current_maturity_stage: string;
  estimated_ripeness: number;
  estimated_moisture: number;
  visual_indicators: string[];
}

export interface TransportAnalysisDetail {
  transport_hours: number;
  arrival_condition: string;
  transport_risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface MarketAnalysisDetail {
  current_price: number;
  expected_price: number;
  price_change_percent: number;
  market_trend: "RISING" | "STABLE" | "FALLING";
  economic_recommendation: string;
  estimated_extra_value_per_unit: number;
}

export interface OpportunityScoreDetail {
  overall_score: number;
  grade: "EXCELLENT" | "GOOD" | "MODERATE" | "POOR";
  crop_maturity_score: number;
  market_opportunity_score: number;
  transport_safety_score: number;
  spoilage_risk_score: number;
}

export interface TimelineStageDetail {
  stage: string;
  title: string;
  time: string;
  date: string;
  description: string;
  status: string;
}

export interface RiskAnalysisDetail {
  early_harvest_risk: string;
  late_harvest_risk: string;
  transport_risk: string;
  rain_risk: str;
}

export interface HarvestWindowPoint {
  day_offset: number;
  date: string;
  maturity_percent: number;
  spoilage_risk_percent: number;
  market_value: number;
  status: string;
}

export interface HarvestAnalysisResponse {
  recommendation: RecommendationDetail;
  crop_analysis: CropAnalysisDetail;
  transport_analysis: TransportAnalysisDetail;
  market_analysis: MarketAnalysisDetail;
  opportunity_score: OpportunityScoreDetail;
  journey_timeline: TimelineStageDetail[];
  risk_analysis: RiskAnalysisDetail;
  decision_factors: string[];
  farmer_action: string[];
  harvest_window_chart: HarvestWindowPoint[];
}

export async function analyzeHarvest(
  data: HarvestAnalysisRequest
): Promise<HarvestAnalysisResponse> {
  const res = await apiClient.post("/api/harvest-intelligence/analyze", data);
  return res.data;
}
