from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from app.schemas.auth import GoogleLoginRequest, TokenResponse, UserResponse
from app.security import (
    verify_google_token,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_user,
)
from app.models.user import User

router = APIRouter()


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleLoginRequest, response: Response):
    """Verify Google ID token, register or login user, return access token + set refresh cookie."""

    # 1. Verify the Google ID Token
    idinfo = verify_google_token(request.token)
    email = idinfo.get("email")
    name = idinfo.get("name", "")
    picture = idinfo.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain email")

    if request.role not in ["farmer", "mandi_owner"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'farmer' or 'mandi_owner'.")

    # 2. Check if user exists
    user = await User.find_one(User.email == email)

    if not user:
        # Register new user
        user = User(
            email=email,
            name=name,
            profile_picture=picture,
            role=request.role,
        )
        await user.insert()
    else:
        # Prevent role switching
        if user.role != request.role:
            raise HTTPException(
                status_code=403,
                detail=f"This account is registered as '{user.role}'. Cannot login as '{request.role}'.",
            )
        # Update profile picture if changed
        if picture and user.profile_picture != picture:
            user.profile_picture = picture
            await user.save()

    # 3. Create tokens
    token_data = {"sub": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # 4. Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
        path="/api/auth",
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            role=user.role,
            profile_picture=user.profile_picture,
        ),
    )


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Issue a new access token using a valid refresh token from the HttpOnly cookie."""

    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token provided")

    payload = verify_refresh_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    user = await User.find_one(User.email == email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Issue new access token
    new_access = create_access_token({"sub": user.email, "role": user.role})

    # Optionally rotate refresh token for extra security
    new_refresh = create_refresh_token({"sub": user.email, "role": user.role})
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/api/auth",
    )

    return {"access_token": new_access}


@router.post("/logout")
async def logout(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        profile_picture=user.profile_picture,
    )
