from fastapi import APIRouter, HTTPException
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

router = APIRouter()

@dataclass
class PrescriptionItem:
    medicine_name: str
    medicine_name_hi: str
    dosage: str
    frequency: str
    duration_days: int
    meal_instruction: str
    side_effects: List[str]
    precautions: List[str]

@dataclass
class PrescriptionRequest:
    disease_id: str
    disease_name: str
    medicines: List[str]
    language: str = "en"
    patient_notes: Optional[str] = None

@dataclass
class PrescriptionResponse:
    prescription_id: str
    date_generated: str
    disease: str
    medicines: List[PrescriptionItem]
    wellness_tips: List[str]
    follow_up_days: int
    doctor_notes: str

# Mock side effects and precautions
MEDICINE_DETAILS = {
    "paracetamol": {
        "side_effects": ["nausea", "rash", "liver damage (rare)"],
        "precautions": ["Avoid alcohol", "Do not exceed 4g per day", "Check for other medications containing paracetamol"]
    },
    "ibuprofen": {
        "side_effects": ["stomach upset", "dizziness", "heartburn"],
        "precautions": ["Take with food", "Avoid with aspirin", "Monitor kidney function"]
    },
    "cetirizine": {
        "side_effects": ["drowsiness", "headache", "dry mouth"],
        "precautions": ["Do not drive", "Avoid alcohol", "Not recommended for pregnant women"]
    },
    "cough_syrup": {
        "side_effects": ["dizziness", "drowsiness", "nausea"],
        "precautions": ["Do not drive", "Avoid alcohol", "Not for children < 4 years"]
    },
    "oseltamivir": {
        "side_effects": ["nausea", "vomiting", "headache"],
        "precautions": ["Take with food", "Start within 48 hours of symptoms", "Monitor for neuropsychiatric effects"]
    }
}

# Wellness tips based on disease
WELLNESS_TIPS_BY_DISEASE = {
    "cold": [
        "🚶 Light walking: 5-10 minutes daily to boost immunity",
        "🧘 Deep breathing exercises: 5 minutes, 2 times daily",
        "💧 Stay hydrated: Drink 2-3 liters of water daily",
        "😴 Get adequate rest: 7-8 hours of sleep",
        "🥗 Eat vitamin C rich foods: Citrus, berries, green vegetables",
        "🌡️ Use steam inhalation: 10 minutes, 2 times daily"
    ],
    "fever": [
        "🧊 Cool compress: Apply to forehead for 15 minutes",
        "💧 Hydration: Drink water, coconut water, and ORS",
        "😴 Complete bed rest: Until fever subsides",
        "🥗 Eat light, nutritious foods: Broth, rice, fruits",
        "🧘 Meditation: 10 minutes to calm body",
        "🌡️ Lukewarm bath: Can help reduce fever naturally"
    ],
    "cough": [
        "💧 Honey and ginger: Warm water with honey, 3 times daily",
        "🧘 Breathing exercises: 5 minutes, morning and night",
        "😴 Elevate head while sleeping: Use extra pillows",
        "🚫 Avoid cold, dry air: Stay in humid environment",
        "🥗 Eat warm broths and soups",
        "💨 Steam inhalation: 10 minutes, 2 times daily"
    ],
    "flu": [
        "😴 Complete rest: 7-10 days until recovery",
        "💧 Stay hydrated: 3-4 liters water daily",
        "🥗 Nutritious diet: Protein, vitamins, minerals",
        "🧘 Light yoga: Gentle stretches once feeling better",
        "🌡️ Maintain hygiene: Prevent spread to others",
        "😷 Isolate: 5 days after symptom onset"
    ],
    "headache": [
        "🧘 Meditation and relaxation: 10 minutes, 2 times daily",
        "💧 Stay hydrated: Often caused by dehydration",
        "🚶 Gentle walk: 5-10 minutes in fresh air",
        "😴 Adequate sleep: 7-8 hours nightly",
        "🧊 Cold compress: On forehead for relief",
        "🌬️ Deep breathing: 5 minutes to reduce tension"
    ]
}

def generate_prescription_id() -> str:
    """Generate unique prescription ID"""
    import uuid
    return f"RX-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

@router.post("/generate-prescription", response_model=PrescriptionResponse)
async def generate_prescription(req: PrescriptionRequest):
    """Generate prescription for a disease with recommended medicines"""

    prescription_items = []

    for med_id in req.medicines:
        details = MEDICINE_DETAILS.get(med_id, {
            "side_effects": ["No known side effects"],
            "precautions": ["Follow doctor's advice"]
        })

        # Mock medicine names - in real app, fetch from DB
        med_names = {
            "paracetamol": {"en": "Paracetamol", "hi": "पैरासिटामोल"},
            "ibuprofen": {"en": "Ibuprofen", "hi": "आइबुप्रोफेन"},
            "cetirizine": {"en": "Cetirizine", "hi": "सेटीरिजीन"},
            "cough_syrup": {"en": "Cough Syrup", "hi": "खांसी की दवा"},
            "oseltamivir": {"en": "Oseltamivir", "hi": "ऑसेल्टामिविर"}
        }

        med_name = med_names.get(med_id, {"en": med_id, "hi": med_id})

        prescription_items.append(
            PrescriptionItem(
                medicine_name=med_name["en"],
                medicine_name_hi=med_name["hi"],
                dosage="As recommended",
                frequency="As prescribed",
                duration_days=5,
                meal_instruction="Follow instructions on package",
                side_effects=details["side_effects"],
                precautions=details["precautions"]
            )
        )

    wellness_tips = WELLNESS_TIPS_BY_DISEASE.get(req.disease_id, [
        "💧 Stay hydrated",
        "😴 Get adequate rest",
        "🥗 Eat nutritious food"
    ])

    doctor_notes_en = f"Take rest for at least 3-5 days. Follow the prescribed medicines strictly. If symptoms persist after 5 days, consult a doctor."
    doctor_notes_hi = f"कम से कम 3-5 दिन आराम करें। निर्धारित दवाओं का कड़ाई से पालन करें। यदि 5 दिन के बाद भी लक्षण बने रहें, तो डॉक्टर से परामर्श लें।"

    return PrescriptionResponse(
        prescription_id=generate_prescription_id(),
        date_generated=datetime.now().isoformat(),
        disease=req.disease_name,
        medicines=prescription_items,
        wellness_tips=wellness_tips,
        follow_up_days=7,
        doctor_notes=doctor_notes_hi if req.language == "hi" else doctor_notes_en
    )

@router.get("/prescriptions")
async def get_prescription_template():
    """Get prescription template"""
    return {
        "template": "Standard prescription format",
        "sections": ["medicines", "dosage", "side_effects", "precautions", "wellness_tips", "follow_up"]
    }
