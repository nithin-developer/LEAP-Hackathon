from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# =====================================================
# SENSOR DATA MODEL
# =====================================================

class SensorData(BaseModel):
    # DHT11
    temperature: float
    humidity: float

    # MPU6050 accelerometer
    acceleration_x: float
    acceleration_y: float
    acceleration_z: float

    # MPU6050 gyroscope
    gyro_x: float
    gyro_y: float
    gyro_z: float

    # MPU6050 temperature
    mpu_temperature: float

    # GPS
    gps_fix: bool
    latitude: float
    longitude: float
    satellites: int
    altitude: float
    speed: float


# =====================================================
# STORE LATEST DATA & TELEMETRY HISTORY
# =====================================================

latest_sensor_data: Optional[Dict[str, Any]] = None
telemetry_history: List[Dict[str, Any]] = []
MAX_HISTORY_ITEMS = 50


# =====================================================
# HEALTH / STATUS CHECK
# =====================================================

@router.get("/sensor-data/status")
@router.get("/iot/status")
def iot_status():
    return {
        "message": "ESP32 Sensor API is running",
        "endpoint": "/sensor-data",
        "has_data": latest_sensor_data is not None,
        "history_count": len(telemetry_history)
    }


# =====================================================
# RECEIVE ESP32 DATA
# =====================================================

@router.post("/sensor-data")
@router.post("/api/sensor-data")
def receive_sensor_data(data: SensorData):
    global latest_sensor_data, telemetry_history

    timestamp = datetime.now(timezone.utc).isoformat()
    formatted_time = datetime.now().strftime("%I:%M:%S %p")

    # Compute composite shock magnitude g = sqrt(ax^2 + ay^2 + az^2)
    composite_shock = round((data.acceleration_x**2 + data.acceleration_y**2 + data.acceleration_z**2)**0.5, 3)

    sensor_dict = {
        "timestamp": timestamp,
        "time": formatted_time,
        "composite_shock": composite_shock,
        **data.model_dump()
    }

    latest_sensor_data = sensor_dict

    # Append to rolling history
    telemetry_history.append(sensor_dict)
    if len(telemetry_history) > MAX_HISTORY_ITEMS:
        telemetry_history.pop(0)

    print("\n" + "=" * 50)
    print("          ESP32 HARDWARE SENSOR DATA RECEIVED")
    print("=" * 50)
    print(f"Timestamp       : {formatted_time}")
    print(f"DHT Temp        : {data.temperature:.2f} °C")
    print(f"DHT Humidity    : {data.humidity:.2f} %")
    print(f"MPU Temp        : {data.mpu_temperature:.2f} °C")
    print(f"Accel (X, Y, Z) : ({data.acceleration_x:.3f}, {data.acceleration_y:.3f}, {data.acceleration_z:.3f}) g")
    print(f"Gyro (X, Y, Z)  : ({data.gyro_x:.3f}, {data.gyro_y:.3f}, {data.gyro_z:.3f}) deg/s")
    print(f"GPS Fix         : {data.gps_fix}")

    if data.gps_fix:
        print(f"Coordinates     : {data.latitude:.6f} N, {data.longitude:.6f} E")
        print(f"Satellites      : {data.satellites}")
        print(f"Altitude        : {data.altitude:.2f} m")
        print(f"Speed           : {data.speed:.2f} km/h")

    print("=" * 50 + "\n")

    return {
        "status": "success",
        "message": "Sensor data received and stored",
        "timestamp": timestamp
    }


# =====================================================
# GET LATEST SENSOR DATA & HISTORY
# =====================================================

@router.get("/sensor-data")
@router.get("/api/sensor-data")
def get_sensor_data():
    if latest_sensor_data is None:
        return {
            "status": "no_data",
            "has_data": False,
            "message": "No hardware device connected. Waiting for ESP32 stream...",
            "data": None,
            "telemetry_history": []
        }

    return {
        "status": "live",
        "has_data": True,
        "message": "Hardware data active",
        "data": latest_sensor_data,
        "telemetry_history": telemetry_history
    }