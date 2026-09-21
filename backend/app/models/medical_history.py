from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Input from patient (voice/text)
class PatientInput(BaseModel):
    type: str  # "voice" or "text"
    text: str
    timestamp: datetime

# Medical History Session
class MedicalHistoryCreate(BaseModel):
    symptoms: List[str]
    patient_inputs: List[PatientInput]  # All voice and text inputs
    language: str = "en"

class DiagnosisInfo(BaseModel):
    disease_id: str
    disease_name: str
    confidence: float
    recommendations: str

class MedicineInfo(BaseModel):
    medicine_name: str
    medicine_name_hi: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: Optional[str] = None

class PrescriptionInfo(BaseModel):
    prescription_id: str
    medicines: List[MedicineInfo]
    wellness_tips: List[str]
    date_generated: datetime

class MedicalHistoryRecord(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    patient_id: str
    symptoms: List[str]
    patient_inputs: List[Dict[str, Any]]  # Store original patient communications
    diagnosis: Optional[DiagnosisInfo] = None
    prescription: Optional[PrescriptionInfo] = None
    language: str = "en"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Update session with diagnosis
class UpdateDiagnosis(BaseModel):
    diagnosis: DiagnosisInfo

# Update session with prescription
class UpdatePrescription(BaseModel):
    prescription: PrescriptionInfo

# Response model for medical history
class MedicalHistoryResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    symptoms: List[str]
    patient_inputs: List[Dict[str, Any]]
    diagnosis: Optional[DiagnosisInfo]
    prescription: Optional[PrescriptionInfo]
    language: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
