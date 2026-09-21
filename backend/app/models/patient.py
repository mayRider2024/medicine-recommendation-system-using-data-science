from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class BloodGroup(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"

# Patient Registration
class PatientCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    date_of_birth: str  # Format: YYYY-MM-DD
    gender: Gender
    blood_group: Optional[BloodGroup] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[List[str]] = []
    chronic_conditions: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []

    @validator('phone')
    def validate_phone(cls, v):
        # Remove spaces and hyphens
        v = v.replace(" ", "").replace("-", "")
        if not v.isdigit() or len(v) != 10:
            raise ValueError('Phone number must be 10 digits')
        return v

    @validator('date_of_birth')
    def validate_dob(cls, v):
        try:
            dob = datetime.strptime(v, "%Y-%m-%d")
            if dob > datetime.now():
                raise ValueError('Date of birth cannot be in the future')
            return v
        except ValueError as e:
            if 'does not match format' in str(e):
                raise ValueError('Date of birth must be in YYYY-MM-DD format')
            raise

# Patient Login
class PatientLogin(BaseModel):
    email: EmailStr
    password: str

# Patient Response (without password)
class PatientResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    full_name: str
    phone: str
    date_of_birth: str
    gender: Gender
    blood_group: Optional[BloodGroup]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    allergies: List[str]
    chronic_conditions: List[str]
    current_medications: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Patient in Database
class PatientInDB(BaseModel):
    email: str
    hashed_password: str
    full_name: str
    phone: str
    date_of_birth: str
    gender: Gender
    blood_group: Optional[BloodGroup]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    current_medications: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    patient: PatientResponse

class TokenData(BaseModel):
    email: Optional[str] = None
