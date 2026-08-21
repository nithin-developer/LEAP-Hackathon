from math import ceil
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from beanie import PydanticObjectId

from app.models.user import User
from app.models.batch import Batch
from app.schemas.batch import (
    BatchCreateRequest,
    BatchStatusUpdateRequest,
    BatchResponse,
    BatchPaginatedResponse,
    MandiOptionResponse,
)
from app.security import get_current_user, require_role

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
# STORE LATEST DATA
# =====================================================

latest_sensor_data = None


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():

    return {
        "message": "ESP32 Sensor API is running",
        "endpoint": "/sensor-data"
    }


# =====================================================
# RECEIVE ESP32 DATA
# =====================================================

@app.post("/sensor-data")
def receive_sensor_data(data: SensorData):

    global latest_sensor_data

    timestamp = datetime.now(timezone.utc).isoformat()

    latest_sensor_data = {
        "timestamp": timestamp,
        **data.model_dump()
    }

    print()
    print("=" * 50)
    print("          SENSOR DATA RECEIVED")
    print("=" * 50)

    print(f"DHT Temperature : {data.temperature:.2f} °C")
    print(f"DHT Humidity    : {data.humidity:.2f} %")

    print()

    print(f"Accel X         : {data.acceleration_x:.3f} g")
    print(f"Accel Y         : {data.acceleration_y:.3f} g")
    print(f"Accel Z         : {data.acceleration_z:.3f} g")

    print()

    print(f"Gyro X          : {data.gyro_x:.3f} deg/s")
    print(f"Gyro Y          : {data.gyro_y:.3f} deg/s")
    print(f"Gyro Z          : {data.gyro_z:.3f} deg/s")

    print()

    print(f"GPS Fix         : {data.gps_fix}")

    if data.gps_fix:
        print(f"Latitude        : {data.latitude:.6f}")
        print(f"Longitude       : {data.longitude:.6f}")

    print(f"Satellites      : {data.satellites}")
    print(f"Altitude        : {data.altitude:.2f} m")
    print(f"Speed           : {data.speed:.2f} km/h")

    print("=" * 50)

    return {
        "status": "success",
        "message": "Sensor data received",
        "timestamp": timestamp
    }


# =====================================================
# GET LATEST DATA
# =====================================================

@app.get("/sensor-data")
def get_sensor_data():

    if latest_sensor_data is None:

        return {
            "status": "no_data",
            "message": "No sensor data received yet"
        }

    return latest_sensor_data