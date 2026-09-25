from fastapi import APIRouter, HTTPException
from typing import Dict, List
import json
from pathlib import Path
from dataclasses import dataclass

router = APIRouter()

@dataclass
class SymptomInput:
    symptoms: List[str]
    language: str = "en"
    answers: Dict[str, str] = None

@dataclass
class DiagnosisResponse:
    disease_id: str
    disease_name: str
    confidence: float
    severity: str
    recommendations: str

# Load symptoms mapping
SYMPTOMS_PATH = Path(__file__).parent.parent / "data" / "symptoms.json"

# Mock ML model for now - in production, load actual pre-trained model
def load_symptom_classifier():
    """Load pre-trained symptom classifier"""
    # For MVP, return a mock classifier
    # In production: pickle.load(open('models/symptom_classifier.pkl', 'rb'))
    return None

symptom_classifier = load_symptom_classifier()

# Mock disease data
DISEASE_DATA = {
    "cold": {
        "name_en": "Common Cold",
        "name_hi": "सर्दी",
        "severity": "mild",
        "description": "Viral infection causing respiratory symptoms. Typically lasts 7-10 days."
    },
    "fever": {
        "name_en": "Fever",
        "name_hi": "बुखार",
        "severity": "moderate",
        "description": "Elevated body temperature (above 98.6°F). Often sign of infection."
    },
    "headache": {
        "name_en": "Headache/Migraine",
        "name_hi": "सिरदर्द",
        "severity": "mild",
        "description": "Pain in head or scalp. Can be tension, migraine, or cluster headache."
    },
    "flu": {
        "name_en": "Influenza (Flu)",
        "name_hi": "फ्लू",
        "severity": "moderate",
        "description": "Viral respiratory infection. More severe than common cold."
    },
    "cough": {
        "name_en": "Bronchitis/Cough",
        "name_hi": "खांसी",
        "severity": "mild",
        "description": "Respiratory reflex. Can be dry or productive."
    },
    "allergy": {
        "name_en": "Allergic Reaction",
        "name_hi": "एलर्जी",
        "severity": "mild",
        "description": "Immune response to allergens. Causes sneezing, runny nose, itching."
    },
    "gastroenteritis": {
        "name_en": "Gastroenteritis",
        "name_hi": "पेट की समस्या",
        "severity": "moderate",
        "description": "Stomach and intestinal inflammation. Causes nausea, vomiting, diarrhea."
    },
    "dysentery": {
        "name_en": "Dysentery",
        "name_hi": "पेचिश",
        "severity": "moderate",
        "description": "Intestinal infection causing severe diarrhea with blood."
    },
    "asthma": {
        "name_en": "Asthma Attack",
        "name_hi": "दमा",
        "severity": "moderate",
        "description": "Respiratory condition causing difficulty breathing and chest tightness."
    },
    "hypertension": {
        "name_en": "High Blood Pressure",
        "name_hi": "उच्च रक्तचाप",
        "severity": "moderate",
        "description": "Blood pressure consistently above 140/90 mmHg."
    }
}

# Symptom to disease mapping
SYMPTOM_DISEASE_MAP = {
    "fever": ["fever", "flu", "cold", "gastroenteritis"],
    "cough": ["cough", "cold", "flu", "asthma", "bronchitis"],
    "sore_throat": ["cold", "flu"],
    "body_ache": ["flu", "fever"],
    "runny_nose": ["cold", "allergy"],
    "headache": ["headache", "fever", "flu", "hypertension"],
    "fatigue": ["flu", "fever", "asthma"],
    "sneezing": ["cold", "allergy"],
    "shortness_of_breath": ["asthma", "bronchitis"],
    "chest_pain": ["asthma", "gastroenteritis"],
}

def diagnose_from_symptoms(symptoms: List[str], answers: Dict[str, str] = None) -> tuple:
    """Rule-based diagnosis with optional clarification-answer tie breakers."""
    disease_scores = {}
    answers = answers or {}

    for symptom in symptoms:
        if symptom in SYMPTOM_DISEASE_MAP:
            for disease in SYMPTOM_DISEASE_MAP[symptom]:
                disease_scores[disease] = disease_scores.get(disease, 0) + 1

    # Clarification answers add transparent tie-breaking evidence.
    if answers.get("breathing") == "yes":
        disease_scores["asthma"] = disease_scores.get("asthma", 0) + 2
    if answers.get("fever_level") == "high":
        disease_scores["flu"] = disease_scores.get("flu", 0) + 1
    if answers.get("onset") == "sudden":
        disease_scores["flu"] = disease_scores.get("flu", 0) + 1
    if answers.get("nasal") == "yes":
        disease_scores["cold"] = disease_scores.get("cold", 0) + 1

    if not disease_scores:
        return "common_ailment", 0.5

    # Stable tie-breaking follows insertion order after answer evidence is applied.
    best_disease = max(disease_scores, key=disease_scores.get)
    confidence = min(disease_scores[best_disease] / max(len(symptoms), 1), 1.0)

    return best_disease, confidence

@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(input_data: SymptomInput):
    """Diagnose disease from symptoms"""
    if not input_data.symptoms:
        raise HTTPException(status_code=400, detail="No symptoms provided")

    disease_id, confidence = diagnose_from_symptoms(input_data.symptoms, input_data.answers)

    if disease_id not in DISEASE_DATA:
        raise HTTPException(status_code=404, detail="Could not diagnose disease")

    disease_info = DISEASE_DATA[disease_id]

    disease_name = disease_info["name_hi"] if input_data.language == "hi" else disease_info["name_en"]

    return DiagnosisResponse(
        disease_id=disease_id,
        disease_name=disease_name,
        confidence=round(confidence, 2),
        severity=disease_info["severity"],
        recommendations=disease_info["description"]
    )

@router.get("/symptoms")
async def get_symptoms(language: str = "en"):
    """Get list of symptoms"""
    symptoms = {
        "en": [
            "fever", "cough", "sore_throat", "body_ache", "runny_nose",
            "headache", "fatigue", "sneezing", "shortness_of_breath", "chest_pain"
        ],
        "hi": [
            "बुखार", "खांसी", "गले_में_खराश", "शरीर_में_दर्द", "नाक_बहना",
            "सिरदर्द", "थकान", "छींक", "सांस_लेने_में_कठिनाई", "छाती_में_दर्द"
        ]
    }
    return {"symptoms": symptoms.get(language, symptoms["en"])}
