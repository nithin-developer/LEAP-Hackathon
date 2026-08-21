import { apiClient } from "@/api/http";

export interface SensorDataPayload {
  timestamp: string;
  time: string;
  temperature: number;
  humidity: number;
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  mpu_temperature: number;
  gps_fix: boolean;
  latitude: number;
  longitude: number;
  satellites: number;
  altitude: number;
  speed: number;
  composite_shock?: number;
}

export interface IoTTelemetryResponse {
  status: "live" | "no_data";
  has_data: boolean;
  message: string;
  data: SensorDataPayload | null;
  telemetry_history: SensorDataPayload[];
}

export async function fetchLiveSensorData(): Promise<IoTTelemetryResponse> {
  const res = await apiClient.get("/api/sensor-data");
  return res.data;
}
