from fastapi import APIRouter, HTTPException, status, Depends
from app.models.medical_history import (
    MedicalHistoryCreate, MedicalHistoryResponse, UpdateDiagnosis,
    UpdatePrescription, MedicalHistoryRecord
)
from app.database import get_database
from app.utils.auth import get_current_user_email
from bson import ObjectId
from datetime import datetime
from typing import List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/medical-history", response_model=MedicalHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_medical_session(
    session_data: MedicalHistoryCreate,
    email: str = Depends(get_current_user_email)
):
    """Create a new medical history session for logged-in patient"""
    try:
        db = await get_database()

        # Get patient ID from email
        patient = await db.patients.find_one({"email": email})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        # Create medical history record
        history_record = MedicalHistoryRecord(
            patient_id=str(patient["_id"]),
            symptoms=session_data.symptoms,
            patient_inputs=[inp.dict() for inp in session_data.patient_inputs],
            language=session_data.language,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Insert into database
        result = await db.medical_history.insert_one(history_record.dict(exclude={"id"}))

        # Get the created record
        created_record = await db.medical_history.find_one({"_id": result.inserted_id})

        return MedicalHistoryResponse(
            _id=str(created_record["_id"]),
            **{k: v for k, v in created_record.items() if k != "_id"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create medical session error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create medical session: {str(e)}"
        )

@router.put("/medical-history/{session_id}/diagnosis", response_model=MedicalHistoryResponse)
async def update_diagnosis(
    session_id: str,
    diagnosis_data: UpdateDiagnosis,
    email: str = Depends(get_current_user_email)
):
    """Update medical session with diagnosis"""
    try:
        db = await get_database()

        # Get patient ID
        patient = await db.patients.find_one({"email": email})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        # Update the session
        result = await db.medical_history.find_one_and_update(
            {
                "_id": ObjectId(session_id),
                "patient_id": str(patient["_id"])
            },
            {
                "$set": {
                    "diagnosis": diagnosis_data.diagnosis.dict(),
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical session not found"
            )

        return MedicalHistoryResponse(
            _id=str(result["_id"]),
            **{k: v for k, v in result.items() if k != "_id"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update diagnosis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update diagnosis"
        )

@router.put("/medical-history/{session_id}/prescription", response_model=MedicalHistoryResponse)
async def update_prescription(
    session_id: str,
    prescription_data: UpdatePrescription,
    email: str = Depends(get_current_user_email)
):
    """Update medical session with prescription"""
    try:
        db = await get_database()

        # Get patient ID
        patient = await db.patients.find_one({"email": email})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        # Update the session
        result = await db.medical_history.find_one_and_update(
            {
                "_id": ObjectId(session_id),
                "patient_id": str(patient["_id"])
            },
            {
                "$set": {
                    "prescription": prescription_data.prescription.dict(),
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical session not found"
            )

        return MedicalHistoryResponse(
            _id=str(result["_id"]),
            **{k: v for k, v in result.items() if k != "_id"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update prescription error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update prescription"
        )

@router.get("/medical-history", response_model=List[MedicalHistoryResponse])
async def get_patient_history(
    email: str = Depends(get_current_user_email),
    limit: int = 50,
    skip: int = 0
):
    """Get all medical history for logged-in patient"""
    try:
        db = await get_database()

        # Get patient ID
        patient = await db.patients.find_one({"email": email})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        # Get medical history records
        cursor = db.medical_history.find(
            {"patient_id": str(patient["_id"])}
        ).sort("created_at", -1).skip(skip).limit(limit)

        records = await cursor.to_list(length=limit)

        return [
            MedicalHistoryResponse(
                _id=str(record["_id"]),
                **{k: v for k, v in record.items() if k != "_id"}
            )
            for record in records
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get patient history error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve medical history"
        )

@router.get("/medical-history/{session_id}", response_model=MedicalHistoryResponse)
async def get_session_details(
    session_id: str,
    email: str = Depends(get_current_user_email)
):
    """Get specific medical session details"""
    try:
        db = await get_database()

        # Get patient ID
        patient = await db.patients.find_one({"email": email})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        # Get the session
        record = await db.medical_history.find_one({
            "_id": ObjectId(session_id),
            "patient_id": str(patient["_id"])
        })

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical session not found"
            )

        return MedicalHistoryResponse(
            _id=str(record["_id"]),
            **{k: v for k, v in record.items() if k != "_id"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get session details error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session details"
        )
