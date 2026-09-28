from pathlib import Path
from typing import Dict, List, Tuple
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "cureai_disease_model.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"CureAI ML model not found: {MODEL_PATH}")

_artifact = joblib.load(MODEL_PATH)
MODEL = _artifact["model"]
FEATURE_NAMES: List[str] = _artifact["feature_names"]
CLASSES: List[str] = _artifact["classes"]

# Existing CureAI symptom IDs -> Kaggle 132-feature names.
# Keep this mapping explicit so the frontend vocabulary can remain stable.
SYMPTOM_ALIASES: Dict[str, List[str]] = {
    "fever": ["mild_fever"],
    "high_fever": ["high_fever"],
    "cough": ["cough"],
    "sore_throat": ["throat_irritation"],
    "body_ache": ["muscle_pain"],
    "runny_nose": ["runny_nose"],
    "headache": ["headache"],
    "fatigue": ["fatigue"],
    "sneezing": ["continuous_sneezing"],
    "nausea": ["nausea"],
    "dizziness": ["dizziness"],
    "chills": ["chills"],
    "chest_pain": ["chest_pain"],
    "shortness_of_breath": ["breathlessness"],
    "loss_of_smell": ["loss_of_smell"],
    "diarrhea": ["diarrhoea"],
    "constipation": ["constipation"],
    "abdominal_pain": ["abdominal_pain"],
    "back_pain": ["back_pain"],
    "joint_pain": ["joint_pain"],
    "rash": ["skin_rash"],
    "sweating": ["sweating"],
    "insomnia": [],  # no matching feature in the 132-feature dataset
}

# Human-friendly labels for the 132 dataset features.
def display_label(feature: str) -> str:
    return feature.replace("_", " ").replace("  ", " ").strip().title()


def build_feature_vector(symptoms: List[str], answers: Dict[str, str] | None = None) -> Tuple[pd.DataFrame, List[str], List[str]]:
    answers = answers or {}
    vector = {feature: 0 for feature in FEATURE_NAMES}
    recognized: List[str] = []
    unsupported: List[str] = []

    for symptom in symptoms:
        key = symptom.strip().lower()
        mapped = list(SYMPTOM_ALIASES.get(key, [key] if key in FEATURE_NAMES else []))
        valid = [feature for feature in mapped if feature in vector]
        if valid:
            recognized.append(key)
            for feature in valid:
                vector[feature] = 1
        else:
            unsupported.append(key)

    # Clarification answers can add information without changing the public symptom vocabulary.
    if answers.get("fever_level") == "high":
        vector["high_fever"] = 1
        # Do not erase mild_fever; the original symptom can still be true.
    if answers.get("nasal") == "yes" and "runny_nose" in vector:
        vector["runny_nose"] = 1
    if answers.get("breathing") == "yes" and "breathlessness" in vector:
        vector["breathlessness"] = 1

    return pd.DataFrame([vector], columns=FEATURE_NAMES), recognized, unsupported


def predict_disease(symptoms: List[str], answers: Dict[str, str] | None = None, top_k: int = 3) -> Dict:
    X, recognized, unsupported = build_feature_vector(symptoms, answers)
    probabilities = MODEL.predict_proba(X)[0]
    ranked = sorted(zip(CLASSES, probabilities), key=lambda item: item[1], reverse=True)[:top_k]

    top_probability = float(ranked[0][1])
    # This is model probability, not a clinically calibrated confidence score.
    needs_clarification = len(recognized) < 3 or top_probability < 0.55

    return {
        "disease": ranked[0][0],
        "probability": top_probability,
        "top_predictions": [
            {"disease": disease, "probability": float(probability)}
            for disease, probability in ranked
        ],
        "recognized_symptoms": recognized,
        "unsupported_symptoms": unsupported,
        "needs_clarification": needs_clarification,
        "feature_count": int(sum(X.iloc[0].values)),
    }


def get_feature_catalog() -> List[Dict[str, str]]:
    return [{"id": f, "label": display_label(f)} for f in FEATURE_NAMES]
