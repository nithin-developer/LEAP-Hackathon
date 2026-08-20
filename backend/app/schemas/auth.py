from typing import Optional
from pydantic import BaseModel, EmailStr


class GoogleLoginRequest(BaseModel):
    token: str
    role: str  # "farmer" or "mandi_owner"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    profile_picture: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
