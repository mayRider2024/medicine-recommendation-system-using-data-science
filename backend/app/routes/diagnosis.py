from fastapi import APIRouter, HTTPException
from typing import Dict, List
import json
from pathlib import Path
from dataclasses import dataclass, field

router = APIRouter()

@dataclass
class SymptomInput:
    symptoms: List[str]
    language: str = "en"
    answers: Dict[str, str] = field(default_factory=dict)

@dataclass
class PossibleDisease:
    disease_id: str
    disease_name: str
    score: int
    confidence: float
    severity: str
    recommendations: str

@dataclass
class DiagnosisResponse:
    disease_id: str
    disease_name: str
    confidence: float
    severity: str
    recommendations: str
    possible_diseases: List[PossibleDisease] = field(default_factory=list)

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
    "common_ailment": {
        "name_en": "Unclassified symptoms",
        "name_hi": "अवर्गीकृत लक्षण",
        "severity": "unknown",
        "description": "The reported symptoms do not match a supported pattern. Seek professional assessment."
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

RESPIRATORY_SYMPTOMS = {"cough", "sore_throat", "runny_nose", "sneezing"}
FLU_SUPPORTING_SYMPTOMS = {"fever", "body_ache", "fatigue", "cough", "sore_throat"}
GASTRO_SYMPTOMS = {"nausea", "diarrhea", "abdominal_pain"}


def rank_diseases(symptoms: List[str], answers: Dict[str, str] = None) -> List[tuple]:
    """Return only diseases whose minimum supporting symptom patterns are present.

    This is an explainable demo ruleset, not a trained or clinically validated model.
    Clarification answers can refine a supported pattern, but cannot create one alone.
    """
    symptom_set = set(symptoms)
    answers = answers or {}
    scores = {}

    if "fever" in symptom_set:
        scores["fever"] = 1

    respiratory = symptom_set & RESPIRATORY_SYMPTOMS
    if len(respiratory) >= 2 or ("fever" in symptom_set and respiratory and answers.get("nasal") == "yes"):
        scores["cold"] = (
            len(respiratory)
            + int("fever" in symptom_set)
            + int(answers.get("nasal") == "yes")
            + int({"runny_nose", "sneezing"}.issubset(symptom_set))
        )

    flu_support = symptom_set & FLU_SUPPORTING_SYMPTOMS
    if "fever" in symptom_set and ("body_ache" in symptom_set or "fatigue" in symptom_set) and len(flu_support) >= 2:
        scores["flu"] = len(flu_support) + int(answers.get("fever_level") == "high") + int(answers.get("onset") == "sudden")

    if "cough" in symptom_set:
        scores["cough"] = 1

    if len(symptom_set & {"runny_nose", "sneezing"}) >= 2:
        scores["allergy"] = len(symptom_set & {"runny_nose", "sneezing"})

    if "shortness_of_breath" in symptom_set:
        scores["asthma"] = 1 + int("chest_pain" in symptom_set) + int(answers.get("breathing") == "yes")

    gi_support = symptom_set & GASTRO_SYMPTOMS
    if len(gi_support) >= 2:
        scores["gastroenteritis"] = len(gi_support) + int("fever" in symptom_set)

    if "headache" in symptom_set:
        scores["headache"] = 1

    if not scores:
        return [("common_ailment", 1)]

    return sorted(scores.items(), key=lambda item: (-item[1], item[0]))


def diagnose_from_symptoms(symptoms: List[str], answers: Dict[str, str] = None) -> tuple:
    """Return the top qualified disease and a heuristic evidence ratio."""
    ranked = rank_diseases(symptoms, answers)
    best_disease, score = ranked[0]
    confidence = min(score / max(len(symptoms), 1), 1.0)
    return best_disease, confidence

@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(input_data: SymptomInput):
    """Diagnose disease from symptoms"""
    if not input_data.symptoms:
        raise HTTPException(status_code=400, detail="No symptoms provided")

    ranked_diseases = rank_diseases(input_data.symptoms, input_data.answers)
    disease_id, top_score = ranked_diseases[0]
    confidence = min(top_score / max(len(input_data.symptoms), 1), 1.0)

    if disease_id not in DISEASE_DATA:
        raise HTTPException(status_code=404, detail="Could not diagnose disease")

    def disease_name_for(candidate_id: str) -> str:
        disease = DISEASE_DATA[candidate_id]
        return disease["name_hi"] if input_data.language == "hi" else disease["name_en"]

    possible_diseases = []
    for candidate_id, score in ranked_diseases:
        candidate_info = DISEASE_DATA[candidate_id]
        possible_diseases.append(PossibleDisease(
            disease_id=candidate_id,
            disease_name=disease_name_for(candidate_id),
            score=score,
            confidence=round(min(score / max(len(input_data.symptoms), 1), 1.0), 2),
            severity=candidate_info["severity"],
            recommendations=candidate_info["description"],
        ))

    disease_info = DISEASE_DATA[disease_id]
    return DiagnosisResponse(
        disease_id=disease_id,
        disease_name=disease_name_for(disease_id),
        confidence=round(confidence, 2),
        severity=disease_info["severity"],
        recommendations=disease_info["description"],
        possible_diseases=possible_diseases,
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
