from fastapi import APIRouter, HTTPException
from typing import Dict, List
from pydantic import BaseModel, Field

from app.ml.model_service import predict_disease, get_feature_catalog, SYMPTOM_ALIASES

router = APIRouter()


class SymptomInput(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    language: str = "en"
    answers: Dict[str, str] = Field(default_factory=dict)


class PossibleDisease(BaseModel):
    disease_id: str
    disease_name: str
    score: float
    confidence: float
    severity: str
    recommendations: str


class DiagnosisResponse(BaseModel):
    disease_id: str
    disease_name: str
    confidence: float
    severity: str
    recommendations: str
    possible_diseases: List[PossibleDisease] = Field(default_factory=list)
    model: str = "random_forest"
    needs_clarification: bool = False
    recognized_symptoms: List[str] = Field(default_factory=list)
    unsupported_symptoms: List[str] = Field(default_factory=list)


# The ML dataset has 41 disease labels. These are normalized here so the
# existing frontend can continue receiving disease_id/disease_name fields.
def normalize_id(name: str) -> str:
    return name.strip().lower().replace(" ", "_").replace("-", "_")


LEGACY_DISEASE_IDS = {
    "Common Cold": "cold",
    "Bronchial Asthma": "asthma",
    "Gastroenteritis": "gastroenteritis",
    "Allergy": "allergy",
    "Hypertension ": "hypertension",
    "Migraine": "headache",
    "Headache": "headache",
    "Influenza (Flu)": "flu",
}


def disease_info(label: str) -> Dict[str, str]:
    key = LEGACY_DISEASE_IDS.get(label, normalize_id(label))
    # Generic metadata: detailed medicine selection remains a separate layer.
    return {
        "id": key,
        "name": label.replace("_", " ").title(),
        "severity": "unknown",
        "description": "ML prediction from the CureAI symptom classifier. This prototype is not clinically validated.",
    }


@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(input_data: SymptomInput):
    if not input_data.symptoms:
        raise HTTPException(status_code=400, detail="No symptoms provided")

    result = predict_disease(input_data.symptoms, input_data.answers, top_k=3)
    top_label = result["disease"]
    top_info = disease_info(top_label)

    possible = []
    for item in result["top_predictions"]:
        info = disease_info(item["disease"])
        possible.append(PossibleDisease(
            disease_id=info["id"],
            disease_name=info["name"],
            score=round(item["probability"], 4),
            confidence=round(item["probability"], 4),
            severity=info["severity"],
            recommendations=info["description"],
        ))

    return DiagnosisResponse(
        disease_id=top_info["id"],
        disease_name=top_info["name"],
        confidence=round(result["probability"], 4),
        severity=top_info["severity"],
        recommendations=top_info["description"],
        possible_diseases=possible,
        model="random_forest",
        needs_clarification=result["needs_clarification"],
        recognized_symptoms=result["recognized_symptoms"],
        unsupported_symptoms=result["unsupported_symptoms"],
    )


@router.get("/symptoms")
async def get_symptoms(language: str = "en"):
    """Return all 132 ML symptoms, plus the existing CureAI aliases."""
    catalog = get_feature_catalog()
    # Keep `symptoms` as a list of strings for compatibility with the
    # existing React selector. The richer objects are exposed separately.
    return {
        "symptoms": [item["id"] for item in catalog],
        "symptom_catalog": catalog,
        "count": len(catalog),
        "source": "cureai_132_symptom_model",
        "aliases": SYMPTOM_ALIASES,
    }


@router.get("/model-info")
async def model_info():
    return {
        "model": "Random Forest",
        "feature_count": 132,
        "message": "Disease prediction uses the trained 132-symptom classifier.",
        "probability_note": "Returned probabilities are model probabilities, not clinically calibrated confidence.",
    }
