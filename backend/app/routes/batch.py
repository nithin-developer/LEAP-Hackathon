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


@router.get("/mandis", response_model=list[MandiOptionResponse])
async def get_mandi_options(user: User = Depends(get_current_user)):
    """Fetch list of registered Mandi Owners for farmer batch creation."""
    mandi_owners = await User.find(User.role == "mandi_owner").to_list()
    return [
        MandiOptionResponse(
            id=str(u.id),
            name=u.name,
            mandi_name=u.mandi_name or f"{u.name}'s Mandi",
            mandi_location=u.mandi_location or u.location or "Default Location",
        )
        for u in mandi_owners
    ]


@router.post("/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    request: BatchCreateRequest,
    user: User = Depends(require_role("farmer")),
):
    """Create a new crop batch (Farmers only)."""
    try:
        mandi_owner_obj_id = PydanticObjectId(request.mandi_owner_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Mandi Owner ID format")

    mandi_owner = await User.get(mandi_owner_obj_id)
    if not mandi_owner or mandi_owner.role != "mandi_owner":
        raise HTTPException(status_code=404, detail="Selected Mandi Owner not found")

    batch = Batch(
        crop_name=request.crop_name,
        variety=request.variety,
        quantity=request.quantity,
        unit=request.unit,
        farmer_id=user.id,
        farmer_name=user.name,
        farmer_email=user.email,
        farmer_location=request.farmer_location or user.location or "Not specified",
        mandi_owner_id=mandi_owner.id,
        mandi_name=mandi_owner.mandi_name or f"{mandi_owner.name}'s Mandi",
        mandi_location=mandi_owner.mandi_location or mandi_owner.location or "Not specified",
        status="PENDING",
        harvest_date=request.harvest_date,
        notes=request.notes,
    )
    await batch.insert()

    return BatchResponse(
        id=str(batch.id),
        crop_name=batch.crop_name,
        variety=batch.variety,
        quantity=batch.quantity,
        unit=batch.unit,
        farmer_id=str(batch.farmer_id),
        farmer_name=batch.farmer_name,
        farmer_email=batch.farmer_email,
        farmer_location=batch.farmer_location,
        mandi_owner_id=str(batch.mandi_owner_id),
        mandi_name=batch.mandi_name,
        mandi_location=batch.mandi_location,
        status=batch.status,
        harvest_date=batch.harvest_date,
        created_at=batch.created_at,
        notes=batch.notes,
    )


@router.get("/batches", response_model=BatchPaginatedResponse)
async def list_batches(
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """Retrieve paginated & filtered list of batches based on user role."""
    query_conditions = []

    # Role-based filtering
    if user.role == "farmer":
        query_conditions.append(Batch.farmer_id == user.id)
    elif user.role == "mandi_owner":
        query_conditions.append(Batch.mandi_owner_id == user.id)

    # Status filter
    if status_filter and status_filter.upper() != "ALL":
        query_conditions.append(Batch.status == status_filter.upper())

    # Build query
    if query_conditions:
        query = Batch.find(*query_conditions)
    else:
        query = Batch.find()

    # Search filter (crop_name or farmer_name or mandi_name)
    if search:
        search_regex = f"(?i).*{search}.*"
        query = query.find({
            "$or": [
                {"crop_name": {"$regex": search_regex}},
                {"farmer_name": {"$regex": search_regex}},
                {"mandi_name": {"$regex": search_regex}},
                {"variety": {"$regex": search_regex}},
            ]
        })

    total = await query.count()
    skip = (page - 1) * size
    batches = await query.sort("-created_at").skip(skip).limit(size).to_list()
    pages = ceil(total / size) if total > 0 else 1

    items = [
        BatchResponse(
            id=str(b.id),
            crop_name=b.crop_name,
            variety=b.variety,
            quantity=b.quantity,
            unit=b.unit,
            farmer_id=str(b.farmer_id),
            farmer_name=b.farmer_name,
            farmer_email=b.farmer_email,
            farmer_location=b.farmer_location,
            mandi_owner_id=str(b.mandi_owner_id),
            mandi_name=b.mandi_name,
            mandi_location=b.mandi_location,
            status=b.status,
            harvest_date=b.harvest_date,
            created_at=b.created_at,
            notes=b.notes,
        )
        for b in batches
    ]

    return BatchPaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/batches/{batch_id}", response_model=BatchResponse)
async def get_batch_details(
    batch_id: str,
    user: User = Depends(get_current_user),
):
    """Get single batch details."""
    try:
        obj_id = PydanticObjectId(batch_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Batch ID format")

    batch = await Batch.get(obj_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Authorization check
    if user.role == "farmer" and batch.farmer_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this batch")
    if user.role == "mandi_owner" and batch.mandi_owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this batch")

    return BatchResponse(
        id=str(batch.id),
        crop_name=batch.crop_name,
        variety=batch.variety,
        quantity=batch.quantity,
        unit=batch.unit,
        farmer_id=str(batch.farmer_id),
        farmer_name=batch.farmer_name,
        farmer_email=batch.farmer_email,
        farmer_location=batch.farmer_location,
        mandi_owner_id=str(batch.mandi_owner_id),
        mandi_name=batch.mandi_name,
        mandi_location=batch.mandi_location,
        status=batch.status,
        harvest_date=batch.harvest_date,
        created_at=batch.created_at,
        notes=batch.notes,
    )


@router.patch("/batches/{batch_id}/status", response_model=BatchResponse)
async def update_batch_status(
    batch_id: str,
    request: BatchStatusUpdateRequest,
    user: User = Depends(get_current_user),
):
    """Update status of a batch."""
    try:
        obj_id = PydanticObjectId(batch_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Batch ID format")

    batch = await Batch.get(obj_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Authorization check
    if user.role == "farmer" and batch.farmer_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this batch")
    if user.role == "mandi_owner" and batch.mandi_owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this batch")

    valid_statuses = ["PENDING", "ACCEPTED", "IN_TRANSIT", "RECEIVED", "REJECTED"]
    new_status = request.status.upper()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{request.status}'. Allowed: {', '.join(valid_statuses)}",
        )

    batch.status = new_status
    if request.notes:
        batch.notes = f"{batch.notes or ''}\n[{user.name} ({user.role})]: {request.notes}".strip()
    await batch.save()

    return BatchResponse(
        id=str(batch.id),
        crop_name=batch.crop_name,
        variety=batch.variety,
        quantity=batch.quantity,
        unit=batch.unit,
        farmer_id=str(batch.farmer_id),
        farmer_name=batch.farmer_name,
        farmer_email=batch.farmer_email,
        farmer_location=batch.farmer_location,
        mandi_owner_id=str(batch.mandi_owner_id),
        mandi_name=batch.mandi_name,
        mandi_location=batch.mandi_location,
        status=batch.status,
        harvest_date=batch.harvest_date,
        created_at=batch.created_at,
        notes=batch.notes,
    )
