from fastapi import APIRouter, HTTPException
from typing import List, Dict
from dataclasses import dataclass

router = APIRouter()

@dataclass
class MedicineDetail:
    id: str
    name_en: str
    name_hi: str
    generic_name: str
    dosage: str
    duration_days: int
    frequency: str
    meal_instruction: str

@dataclass
class MedicinesResponse:
    disease_id: str
    disease_name: str
    medicines: List[MedicineDetail]
    language: str

# Mock medicine data
MOCK_MEDICINES = {
    "cold": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 3,
            "frequency": "3 times daily",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "cetirizine",
            "name_en": "Cetirizine",
            "name_hi": "सेटीरिजीन",
            "generic_name": "Cetirizine Hydrochloride",
            "dosage": "10mg",
            "duration_days": 5,
            "frequency": "Once daily at night",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "fever": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 3,
            "frequency": "Every 4-6 hours, max 4000mg/day",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "ibuprofen",
            "name_en": "Ibuprofen",
            "name_hi": "आइबुप्रोफेन",
            "generic_name": "Ibuprofen",
            "dosage": "400mg",
            "duration_days": 3,
            "frequency": "Every 6-8 hours",
            "meal_instruction": "Take with food to avoid stomach upset"
        }
    ],
    "cough": [
        {
            "id": "cough_syrup",
            "name_en": "Cough Syrup",
            "name_hi": "खांसी_की_दवा",
            "generic_name": "Dextromethorphan + Phenylephrine",
            "dosage": "10ml",
            "duration_days": 5,
            "frequency": "Twice daily (10ml each)",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "flu": [
        {
            "id": "oseltamivir",
            "name_en": "Oseltamivir (Tamiflu)",
            "name_hi": "ऑसेल्टामिविर",
            "generic_name": "Oseltamivir",
            "dosage": "75mg",
            "duration_days": 5,
            "frequency": "Twice daily",
            "meal_instruction": "Take with food"
        },
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 5,
            "frequency": "Every 4-6 hours",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "headache": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 2,
            "frequency": "1-2 tablets every 4-6 hours",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "aspirin",
            "name_en": "Aspirin",
            "name_hi": "एस्पिरिन",
            "generic_name": "Acetylsalicylic Acid",
            "dosage": "300-500mg",
            "duration_days": 2,
            "frequency": "Every 4-6 hours as needed",
            "meal_instruction": "Take with food or milk"
        }
    ],
    "allergy": [
        {
            "id": "cetirizine",
            "name_en": "Cetirizine",
            "name_hi": "सेटीरिजीन",
            "generic_name": "Cetirizine Hydrochloride",
            "dosage": "10mg",
            "duration_days": 7,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "loratadine",
            "name_en": "Loratadine",
            "name_hi": "लोरेटाडाइन",
            "generic_name": "Loratadine",
            "dosage": "10mg",
            "duration_days": 7,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "gastroenteritis": [
        {
            "id": "domperidone",
            "name_en": "Domperidone",
            "name_hi": "डोमपेरिडोन",
            "generic_name": "Domperidone",
            "dosage": "10mg",
            "duration_days": 5,
            "frequency": "3-4 times daily",
            "meal_instruction": "Take 30 minutes before meals"
        },
        {
            "id": "loperamide",
            "name_en": "Loperamide",
            "name_hi": "लोपेरामाइड",
            "generic_name": "Loperamide",
            "dosage": "2mg",
            "duration_days": 3,
            "frequency": "After each loose stool, max 8mg/day",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "dysentery": [
        {
            "id": "ciprofloxacin",
            "name_en": "Ciprofloxacin",
            "name_hi": "सिप्रोफ्लोक्सासिन",
            "generic_name": "Ciprofloxacin",
            "dosage": "500mg",
            "duration_days": 7,
            "frequency": "Twice daily",
            "meal_instruction": "Take 2 hours before or after meals"
        },
        {
            "id": "ors",
            "name_en": "ORS Solution",
            "name_hi": "ओआरएस_घोल",
            "generic_name": "Oral Rehydration Salts",
            "dosage": "1 sachet in 1L water",
            "duration_days": 3,
            "frequency": "Sip frequently throughout the day",
            "meal_instruction": "Between meals"
        }
    ],
    "asthma": [
        {
            "id": "salbutamol",
            "name_en": "Salbutamol Inhaler",
            "name_hi": "साल्बुटामोल_इनहेलर",
            "generic_name": "Albuterol/Salbutamol",
            "dosage": "100 mcg/puff",
            "duration_days": 30,
            "frequency": "As needed during attacks",
            "meal_instruction": "Inhaled medication"
        },
        {
            "id": "theophylline",
            "name_en": "Theophylline",
            "name_hi": "थिओफिलिन",
            "generic_name": "Theophylline",
            "dosage": "250mg",
            "duration_days": 30,
            "frequency": "Twice daily",
            "meal_instruction": "Take with or without food consistently"
        }
    ],
    "hypertension": [
        {
            "id": "amlodipine",
            "name_en": "Amlodipine",
            "name_hi": "अमलोडिपिन",
            "generic_name": "Amlodipine Besylate",
            "dosage": "5-10mg",
            "duration_days": 30,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "lisinopril",
            "name_en": "Lisinopril",
            "name_hi": "लिसिनोप्रिल",
            "generic_name": "Lisinopril",
            "dosage": "10mg",
            "duration_days": 30,
            "frequency": "Once daily in morning",
            "meal_instruction": "Take at same time each day"
        }
    ]
}

DISEASE_NAMES = {
    "cold": {"en": "Common Cold", "hi": "सर्दी"},
    "fever": {"en": "Fever", "hi": "बुखार"},
    "cough": {"en": "Cough", "hi": "खांसी"},
    "flu": {"en": "Influenza", "hi": "फ्लू"},
    "headache": {"en": "Headache/Migraine", "hi": "सिरदर्द"},
    "allergy": {"en": "Allergic Reaction", "hi": "एलर्जी"},
    "gastroenteritis": {"en": "Gastroenteritis", "hi": "पेट की समस्या"},
    "dysentery": {"en": "Dysentery", "hi": "पेचिश"},
    "asthma": {"en": "Asthma", "hi": "दमा"},
    "hypertension": {"en": "High Blood Pressure", "hi": "उच्च रक्तचाप"}
}

@router.get("/medicines/{disease_id}", response_model=MedicinesResponse)
async def get_medicines_for_disease(disease_id: str, language: str = "en"):
    """Get recommended medicines for a disease"""
    if disease_id not in MOCK_MEDICINES:
        raise HTTPException(status_code=404, detail="Disease not found")

    medicines_data = MOCK_MEDICINES[disease_id]
    disease_names = DISEASE_NAMES.get(disease_id, {"en": disease_id, "hi": disease_id})

    medicines = [
        MedicineDetail(**med) for med in medicines_data
    ]

    return MedicinesResponse(
        disease_id=disease_id,
        disease_name=disease_names.get(language, disease_names["en"]),
        medicines=medicines,
        language=language
    )

@router.get("/medicines")
async def get_all_medicines(language: str = "en"):
    """Get list of all available medicines"""
    all_medicines = []
    for medicines_list in MOCK_MEDICINES.values():
        all_medicines.extend(medicines_list)

    # Remove duplicates by id
    seen = set()
    unique_medicines = []
    for med in all_medicines:
        if med["id"] not in seen:
            unique_medicines.append(med)
            seen.add(med["id"])

    return {"medicines": unique_medicines, "total": len(unique_medicines)}
