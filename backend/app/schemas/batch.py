from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class BatchCreateRequest(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    quantity: float = Field(gt=0, description="Quantity must be greater than 0")
    unit: str = "kg"
    farmer_location: str
    mandi_owner_id: str
    harvest_date: datetime
    notes: Optional[str] = None

class BatchStatusUpdateRequest(BaseModel):
    status: str  # PENDING | ACCEPTED | IN_TRANSIT | RECEIVED | REJECTED
    notes: Optional[str] = None

class BatchResponse(BaseModel):
    id: str
    crop_name: str
    variety: Optional[str] = None
    quantity: float
    unit: str
    farmer_id: str
    farmer_name: str
    farmer_email: str
    farmer_location: str
    mandi_owner_id: str
    mandi_name: str
    mandi_location: Optional[str] = None
    status: str
    harvest_date: datetime
    created_at: datetime
    notes: Optional[str] = None

class BatchPaginatedResponse(BaseModel):
    items: List[BatchResponse]
    total: int
    page: int
    size: int
    pages: int

class MandiOptionResponse(BaseModel):
    id: str
    name: str
    mandi_name: str
    mandi_location: Optional[str] = None
