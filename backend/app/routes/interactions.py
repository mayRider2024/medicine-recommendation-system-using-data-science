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

# Mock drug interactions database
DRUG_INTERACTIONS_DB = {
    ("paracetamol", "ibuprofen"): {
        "severity": "high",
        "description": "Concurrent use may increase risk of gastrointestinal bleeding and ulceration"
    },
    ("oseltamivir", "ibuprofen"): {
        "severity": "moderate",
        "description": "May increase risk of renal dysfunction when combined"
    },
    ("cetirizine", "alcohol"): {
        "severity": "moderate",
        "description": "May cause increased drowsiness and impaired judgment"
    }
}

def check_interaction(med1: str, med2: str) -> Optional[dict]:
    """Check if two medicines interact"""
    # Check both orders
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
