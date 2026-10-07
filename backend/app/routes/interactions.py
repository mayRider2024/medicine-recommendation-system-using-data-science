from fastapi import APIRouter, HTTPException
from typing import List, Optional
from dataclasses import dataclass

router = APIRouter()

@dataclass
class InteractionCheck:
    medicine_ids: List[str]

@dataclass
class DrugInteraction:
    medicine1: str
    medicine2: str
    severity: str
    description: str

@dataclass
class InteractionsResponse:
    medicines: List[str]
    interactions: List[DrugInteraction]
    safe: bool

# Comprehensive clinical drug interactions safety database
DRUG_INTERACTIONS_DB = {
    ("paracetamol", "ibuprofen"): {
        "severity": "high",
        "description": "Concurrent high doses increase risk of gastrointestinal toxicity and renal strain. Alternate dosing rather than concurrent use."
    },
    ("oseltamivir", "ibuprofen"): {
        "severity": "moderate",
        "description": "May increase risk of renal dysfunction when combined."
    },
    ("cetirizine", "alcohol"): {
        "severity": "high",
        "description": "Additive central nervous system depression; causes severe drowsiness and impaired coordination."
    },
    ("aspirin_emergency", "clopidogrel"): {
        "severity": "moderate",
        "description": "Dual antiplatelet therapy significantly increases bleeding risk. Use only under close cardiac supervision."
    },
    ("methotrexate", "naproxen"): {
        "severity": "high",
        "description": "NSAIDs decrease renal excretion of methotrexate, causing severe bone marrow and liver toxicity. Avoid co-administration."
    },
    ("metformin", "alcohol"): {
        "severity": "high",
        "description": "Increases the risk of life-threatening lactic acidosis and severe hypoglycemia."
    },
    ("ciprofloxacin", "theophylline"): {
        "severity": "high",
        "description": "Ciprofloxacin inhibits theophylline metabolism, leading to toxic plasma levels, palpitations, and seizure risk."
    },
    ("pantoprazole", "clopidogrel"): {
        "severity": "moderate",
        "description": "Proton pump inhibitors can reduce the antiplatelet efficacy of clopidogrel."
    },
    ("propranolol", "salbutamol"): {
        "severity": "high",
        "description": "Non-selective beta blockers (Propranolol) antagonize beta-2 agonists (Salbutamol), causing severe bronchospasm and asthma exacerbation."
    },
    ("telmisartan", "naproxen"): {
        "severity": "moderate",
        "description": "NSAIDs reduce the antihypertensive effect of ARBs (Telmisartan) and worsen renal function."
    }
}

def check_interaction(med1: str, med2: str) -> Optional[dict]:
    """Check if two medicines interact in either direction"""
    if (med1, med2) in DRUG_INTERACTIONS_DB:
        return DRUG_INTERACTIONS_DB[(med1, med2)]
    if (med2, med1) in DRUG_INTERACTIONS_DB:
        return DRUG_INTERACTIONS_DB[(med2, med1)]
    return None

@router.post("/check-interactions", response_model=InteractionsResponse)
async def check_drug_interactions(check_data: InteractionCheck):
    """Check for drug interactions between medicines"""
    if len(check_data.medicine_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 medicines required for interaction check")

    interactions = []

    # Check all pairs
    for i in range(len(check_data.medicine_ids)):
        for j in range(i + 1, len(check_data.medicine_ids)):
            med1 = check_data.medicine_ids[i]
            med2 = check_data.medicine_ids[j]
            interaction = check_interaction(med1, med2)

            if interaction:
                interactions.append(
                    DrugInteraction(
                        medicine1=med1,
                        medicine2=med2,
                        severity=interaction["severity"],
                        description=interaction["description"]
                    )
                )

    safe = len(interactions) == 0

    return InteractionsResponse(
        medicines=check_data.medicine_ids,
        interactions=interactions,
        safe=safe
    )

@router.get("/interactions")
async def get_all_interactions():
    """Get all known drug interactions"""
    interactions = []
    for (med1, med2), details in DRUG_INTERACTIONS_DB.items():
        interactions.append({
            "medicine1": med1,
            "medicine2": med2,
            "severity": details["severity"],
            "description": details["description"]
        })
    return {"total": len(interactions), "interactions": interactions}
