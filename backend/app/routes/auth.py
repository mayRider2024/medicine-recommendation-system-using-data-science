from fastapi import APIRouter, HTTPException, status, Depends
from app.models.patient import PatientCreate, PatientLogin, PatientResponse, PatientInDB, Token
from app.database import get_database
from app.utils.auth import get_password_hash, verify_password, create_access_token, get_current_user_email
from bson import ObjectId
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/auth/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(patient_data: PatientCreate):
    """Register a new patient"""
    try:
        db = await get_database()

        # Check if email already exists
        existing_patient = await db.patients.find_one({"email": patient_data.email})
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if phone already exists
        existing_phone = await db.patients.find_one({"phone": patient_data.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )

        # Hash password and create patient
        hashed_password = get_password_hash(patient_data.password)

        patient_dict = patient_data.dict(exclude={"password"})
        patient_in_db = PatientInDB(
            **patient_dict,
            hashed_password=hashed_password,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Insert into database
        result = await db.patients.insert_one(patient_in_db.dict())

        # Get the created patient
        created_patient = await db.patients.find_one({"_id": result.inserted_id})

        # Create access token
        access_token = create_access_token(data={"sub": patient_data.email})

        # Prepare response
        patient_response = PatientResponse(
            _id=str(created_patient["_id"]),
            **{k: v for k, v in created_patient.items() if k != "_id" and k != "hashed_password"}
        )

        return Token(
            access_token=access_token,
            patient=patient_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/auth/login", response_model=Token)
async def login(credentials: PatientLogin):
    """Login a patient"""
    try:
        db = await get_database()

        # Find patient by email
        patient = await db.patients.find_one({"email": credentials.email})

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Verify password
        if not verify_password(credentials.password, patient["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Create access token
        access_token = create_access_token(data={"sub": credentials.email})

        # Prepare response
        patient_response = PatientResponse(
            _id=str(patient["_id"]),
            **{k: v for k, v in patient.items() if k != "_id" and k != "hashed_password"}
        )

        return Token(
            access_token=access_token,
            patient=patient_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/auth/me", response_model=PatientResponse)
async def get_current_patient(email: str = Depends(get_current_user_email)):
    """Get current logged-in patient details"""
    try:
        db = await get_database()

        patient = await db.patients.find_one({"email": email})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        return PatientResponse(
            _id=str(patient["_id"]),
            **{k: v for k, v in patient.items() if k != "_id" and k != "hashed_password"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current patient error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get patient information"
        )

@router.put("/auth/profile", response_model=PatientResponse)
async def update_profile(
    updates: dict,
    email: str = Depends(get_current_user_email)
):
    """Update patient profile"""
    try:
        db = await get_database()

        # Don't allow updating email, password, or created_at
        prohibited_fields = {"email", "password", "hashed_password", "created_at", "_id"}
        for field in prohibited_fields:
            if field in updates:
                del updates[field]

        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )

        updates["updated_at"] = datetime.utcnow()

        # Update patient
        result = await db.patients.find_one_and_update(
            {"email": email},
            {"$set": updates},
            return_document=True
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        return PatientResponse(
            _id=str(result["_id"]),
            **{k: v for k, v in result.items() if k != "_id" and k != "hashed_password"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
