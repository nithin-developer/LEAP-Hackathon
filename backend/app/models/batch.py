from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field

class Batch(Document):
    crop_name: str
    variety: Optional[str] = None
    quantity: float
    unit: str = "kg"  # e.g., kg, quintal, ton
    
    farmer_id: PydanticObjectId
    farmer_name: str
    farmer_email: str
    farmer_location: str
    
    mandi_owner_id: PydanticObjectId
    mandi_name: str
    mandi_location: Optional[str] = None
    
    # Status: PENDING | ACCEPTED | IN_TRANSIT | RECEIVED | REJECTED
    status: str = "PENDING"
    
    harvest_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

    class Settings:
        name = "batches"
        indexes = [
            "farmer_id",
            "mandi_owner_id",
            "status",
            "crop_name",
        ]
