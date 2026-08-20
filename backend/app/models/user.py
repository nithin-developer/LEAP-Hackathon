from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import EmailStr, Field

class User(Document):
    email: EmailStr
    name: str
    profile_picture: Optional[str] = None
    role: str # "farmer" or "mandi_owner"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Specific fields for Mandi Owner
    mandi_name: Optional[str] = None
    mandi_location: Optional[str] = None
    
    # Specific fields for Farmer
    location: Optional[str] = None

    class Settings:
        name = "users"
        indexes = [
            "email",
        ]
