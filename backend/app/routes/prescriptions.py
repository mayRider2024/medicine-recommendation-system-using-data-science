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
MEDICINE_SCHEDULES = {
    "paracetamol": {"dosage": "500 mg (1 tablet)", "frequency": "Every 6-8 hours as needed; max 3 tablets/day", "duration_days": 3, "meal_instruction": "After food; drink a full glass of water"},
    "ibuprofen": {"dosage": "400 mg (1 tablet)", "frequency": "Every 8 hours as needed", "duration_days": 3, "meal_instruction": "After breakfast, lunch, or dinner; never on an empty stomach"},
    "cetirizine": {"dosage": "10 mg (1 tablet)", "frequency": "Once daily", "duration_days": 5, "meal_instruction": "After dinner or at bedtime; may cause drowsiness"},
    "cough_syrup": {"dosage": "10 ml", "frequency": "Twice daily", "duration_days": 5, "meal_instruction": "After breakfast and after dinner; measure with the supplied cup"},
    "oseltamivir": {"dosage": "75 mg (1 capsule)", "frequency": "Twice daily, approximately 12 hours apart", "duration_days": 5, "meal_instruction": "After breakfast and after dinner"},
}

MEDICINE_BILINGUAL = {
    "paracetamol": {
        "frequency": "हर 6-8 घंटे जरूरत के अनुसार; दिन में अधिकतम 3 टैबलेट / Every 6-8 hours as needed; max 3 tablets/day",
        "meal_instruction": "खाने के बाद; एक पूरा गिलास पानी के साथ / After food; drink a full glass of water",
        "precautions": ["शराब से बचें / Avoid alcohol", "दिन में 4 ग्राम से अधिक न लें / Do not exceed 4g per day", "अन्य पैरासिटामोल वाली दवाएं जांचें / Check other medications containing paracetamol"],
        "side_effects": ["मतली / nausea", "चकत्ते / rash", "दुर्लभ: जिगर को नुकसान / rare: liver damage"]
    },
    "ibuprofen": {
        "frequency": "हर 8 घंटे जरूरत के अनुसार / Every 8 hours as needed",
        "meal_instruction": "नाश्ते, दोपहर या रात के खाने के बाद; खाली पेट न लें / After breakfast, lunch, or dinner; never on an empty stomach",
        "precautions": ["भोजन के साथ लें / Take with food", "एस्पिरिन के साथ न लें / Avoid with aspirin", "किडनी की निगरानी करें / Monitor kidney function"],
        "side_effects": ["पेट खराब / stomach upset", "चक्कर / dizziness", "सीने में जलन / heartburn"]
    },
    "cetirizine": {
        "frequency": "दिन में एक बार / Once daily",
        "meal_instruction": "रात के खाने के बाद या सोते समय; नींद आ सकती है / After dinner or at bedtime; may cause drowsiness",
        "precautions": ["गाड़ी न चलाएं / Do not drive", "शराब से बचें / Avoid alcohol", "गर्भावस्था में डॉक्टर से पूछें / Ask a doctor if pregnant"],
        "side_effects": ["नींद आना / drowsiness", "सिरदर्द / headache", "मुंह सूखना / dry mouth"]
    },
    "cough_syrup": {
        "frequency": "दिन में दो बार / Twice daily",
        "meal_instruction": "नाश्ते और रात के खाने के बाद; मापने वाले कप का उपयोग करें / After breakfast and dinner; use the supplied measuring cup",
        "precautions": ["गाड़ी न चलाएं / Do not drive", "शराब से बचें / Avoid alcohol", "4 साल से कम बच्चों के लिए नहीं / Not for children under 4"],
        "side_effects": ["चक्कर / dizziness", "नींद आना / drowsiness", "मतली / nausea"]
    },
    "oseltamivir": {
        "frequency": "दिन में दो बार, लगभग 12 घंटे के अंतर से / Twice daily, approximately 12 hours apart",
        "meal_instruction": "नाश्ते और रात के खाने के बाद / After breakfast and after dinner",
        "precautions": ["भोजन के साथ लें / Take with food", "लक्षण शुरू होने के 48 घंटे के भीतर शुरू करें / Start within 48 hours of symptoms", "व्यवहार या मानसिक बदलावों पर ध्यान दें / Monitor for neuropsychiatric effects"],
        "side_effects": ["मतली / nausea", "उल्टी / vomiting", "सिरदर्द / headache"]
    }
}

MEDICINE_DOSAGE_HI = {
    "paracetamol": "500 मिलीग्राम (1 टैबलेट) / 500 mg (1 tablet)",
    "ibuprofen": "400 मिलीग्राम (1 टैबलेट) / 400 mg (1 tablet)",
    "cetirizine": "10 मिलीग्राम (1 टैबलेट) / 10 mg (1 tablet)",
    "cough_syrup": "10 मिलीलीटर / 10 ml",
    "oseltamivir": "75 मिलीग्राम (1 कैप्सूल) / 75 mg (1 capsule)"
}

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

WELLNESS_TIPS_BY_DISEASE_HI = {
    "cold": ["🚶 प्रतिदिन 5-10 मिनट हल्की सैर करें", "🧘 दिन में 2 बार 5 मिनट गहरी सांस लें", "💧 2-3 लीटर पानी पिएं", "😴 7-8 घंटे पर्याप्त नींद लें", "🥗 विटामिन C युक्त भोजन खाएं", "🌡️ दिन में 2 बार 10 मिनट भाप लें"],
    "fever": ["🧊 माथे पर 15 मिनट ठंडी पट्टी रखें", "💧 पानी, नारियल पानी और ORS लें", "😴 बुखार कम होने तक पूरा आराम करें", "🥗 हल्का और पौष्टिक भोजन लें", "🧘 10 मिनट ध्यान करें", "🌡️ गुनगुने पानी से स्नान करें"],
    "cough": ["💧 शहद और अदरक वाला गुनगुना पानी लें", "🧘 सुबह और रात 5 मिनट सांस के व्यायाम करें", "😴 सोते समय सिर ऊंचा रखें", "🚫 ठंडी और सूखी हवा से बचें", "🥗 गर्म सूप और शोरबा लें", "💨 दिन में 2 बार 10 मिनट भाप लें"],
    "flu": ["😴 ठीक होने तक 7-10 दिन पूरा आराम करें", "💧 3-4 लीटर पानी पिएं", "🥗 प्रोटीन और विटामिन युक्त भोजन लें", "🧘 बेहतर महसूस होने पर हल्का योग करें", "🌡️ संक्रमण रोकने के लिए स्वच्छता रखें", "😷 लक्षण शुरू होने के बाद 5 दिन तक अलग रहें"],
    "headache": ["🧘 दिन में 2 बार 10 मिनट ध्यान करें", "💧 पर्याप्त पानी पिएं", "🚶 ताजी हवा में 5-10 मिनट हल्की सैर करें", "😴 हर रात 7-8 घंटे सोएं", "🧊 माथे पर ठंडी पट्टी रखें", "🌬️ तनाव कम करने के लिए गहरी सांस लें"]
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

        schedule = MEDICINE_SCHEDULES.get(med_id, {
            "dosage": "As directed by a qualified doctor",
            "frequency": "As prescribed",
            "duration_days": 5,
            "meal_instruction": "Follow the package instructions"
        }).copy()
        details = details.copy()
        if req.language == "hi" and med_id in MEDICINE_BILINGUAL:
            bilingual = MEDICINE_BILINGUAL[med_id]
            schedule["dosage"] = MEDICINE_DOSAGE_HI.get(med_id, schedule["dosage"])
            schedule["frequency"] = bilingual["frequency"]
            schedule["meal_instruction"] = bilingual["meal_instruction"]
            details["precautions"] = bilingual["precautions"]
            details["side_effects"] = bilingual["side_effects"]

        prescription_items.append(
            PrescriptionItem(
                medicine_name=med_name["en"],
                medicine_name_hi=med_name["hi"],
                dosage=schedule["dosage"],
                frequency=schedule["frequency"],
                duration_days=schedule["duration_days"],
                meal_instruction=schedule["meal_instruction"],
                side_effects=details["side_effects"],
                precautions=details["precautions"]
            )
        )

    wellness_tips = (WELLNESS_TIPS_BY_DISEASE_HI if req.language == "hi" else WELLNESS_TIPS_BY_DISEASE).get(req.disease_id, [
        "💧 पर्याप्त पानी पिएं" if req.language == "hi" else "💧 Stay hydrated",
        "😴 पर्याप्त आराम करें" if req.language == "hi" else "😴 Get adequate rest",
        "🥗 पौष्टिक भोजन लें" if req.language == "hi" else "🥗 Eat nutritious food"
    ])

    if req.language == "hi":
        english_tips = WELLNESS_TIPS_BY_DISEASE.get(req.disease_id, [])
        wellness_tips = [f"{hi_tip} / {en_tip}" for hi_tip, en_tip in zip(wellness_tips, english_tips)] or wellness_tips

    doctor_notes_en = "Take rest for at least 3-5 days. Follow the prescribed medicines strictly. If symptoms persist after 5 days, consult a doctor."
    doctor_notes_hi = "कम से कम 3-5 दिन आराम करें। निर्धारित दवाओं का कड़ाई से पालन करें। यदि 5 दिन के बाद भी लक्षण बने रहें, तो डॉक्टर से परामर्श लें। / Take rest for at least 3-5 days. Follow the prescribed medicines strictly. If symptoms persist after 5 days, consult a doctor."

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
