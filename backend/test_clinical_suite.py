import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

# Comprehensive Clinical Test Suite
TEST_CASES = [
    {
        "category": "Infectious & Tropical Diseases",
        "symptoms": ["chills", "vomiting", "high_fever", "sweating", "headache", "nausea", "muscle_pain"],
        "expected_diseases": ["Malaria", "Dengue", "Typhoid"],
        "key_symptom_notes": "High fever, chills, sweating, muscle pain"
    },
    {
        "category": "Infectious & Tropical Diseases (Dengue Profile)",
        "symptoms": ["skin_rash", "chills", "joint_pain", "vomiting", "fatigue", "high_fever", "headache", "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "muscle_pain", "red_spots_over_body"],
        "expected_diseases": ["Dengue"],
        "key_symptom_notes": "Pain behind eyes, red spots, high fever, joint pain"
    },
    {
        "category": "Infectious & Tropical Diseases (Typhoid Profile)",
        "symptoms": ["chills", "vomiting", "fatigue", "high_fever", "headache", "nausea", "constipation", "abdominal_pain", "diarrhoea", "toxic_look_(typhos)", "belly_pain"],
        "expected_diseases": ["Typhoid"],
        "key_symptom_notes": "Continuous high fever, abdominal pain, toxic look"
    },
    {
        "category": "Respiratory Conditions (Pneumonia)",
        "symptoms": ["chills", "fatigue", "cough", "high_fever", "breathlessness", "sweating", "chest_pain", "fast_heart_rate", "phlegm", "rusty_sputum"],
        "expected_diseases": ["Pneumonia"],
        "key_symptom_notes": "Cough, rusty sputum, breathlessness, high fever"
    },
    {
        "category": "Respiratory Conditions (Common Cold)",
        "symptoms": ["continuous_sneezing", "chills", "fatigue", "cough", "high_fever", "headache", "swelled_lymph_nodes", "malaise", "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion", "chest_pain", "loss_of_smell"],
        "expected_diseases": ["Common Cold"],
        "key_symptom_notes": "Sneezing, runny nose, throat irritation, loss of smell"
    },
    {
        "category": "Respiratory Conditions (Bronchial Asthma)",
        "symptoms": ["fatigue", "cough", "high_fever", "breathlessness", "family_history", "mucoid_sputum"],
        "expected_diseases": ["Bronchial Asthma"],
        "key_symptom_notes": "Breathlessness, mucoid sputum, cough"
    },
    {
        "category": "Respiratory Conditions (Tuberculosis)",
        "symptoms": ["chills", "vomiting", "fatigue", "weight_loss", "cough", "high_fever", "breathlessness", "sweating", "loss_of_appetite", "mild_fever", "yellowing_of_eyes", "swelled_lymph_nodes", "phlegm", "chest_pain", "blood_in_sputum"],
        "expected_diseases": ["Tuberculosis"],
        "key_symptom_notes": "Persistent cough, blood in sputum, weight loss, night sweats"
    },
    {
        "category": "Hepatic & Biliary (Hepatitis D)",
        "symptoms": ["joint_pain", "vomiting", "fatigue", "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes"],
        "expected_diseases": ["Hepatitis D", "Hepatitis C", "Hepatitis B", "Chronic cholestasis", "Jaundice"],
        "key_symptom_notes": "Jaundice signs, dark urine, joint pain"
    },
    {
        "category": "Hepatic & Biliary (Alcoholic Hepatitis)",
        "symptoms": ["vomiting", "yellowish_skin", "abdominal_pain", "swelling_of_stomach", "distention_of_abdomen", "history_of_alcohol_consumption", "fluid_overload"],
        "expected_diseases": ["Alcoholic hepatitis"],
        "key_symptom_notes": "History of alcohol, abdominal distention, fluid overload"
    },
    {
        "category": "Hepatic & Biliary (Jaundice)",
        "symptoms": ["vomiting", "fatigue", "weight_loss", "high_fever", "yellowish_skin", "dark_urine", "abdominal_pain"],
        "expected_diseases": ["Jaundice", "hepatitis A"],
        "key_symptom_notes": "Yellowish skin, dark urine, abdominal pain"
    },
    {
        "category": "Gastrointestinal (GERD)",
        "symptoms": ["stomach_pain", "acidity", "ulcers_on_tongue", "vomiting", "cough", "chest_pain"],
        "expected_diseases": ["GERD"],
        "key_symptom_notes": "Acidity, stomach pain, chest pain"
    },
    {
        "category": "Gastrointestinal (Peptic Ulcer Disease)",
        "symptoms": ["vomiting", "loss_of_appetite", "abdominal_pain", "passage_of_gases", "internal_itching"],
        "expected_diseases": ["Peptic ulcer diseae"],
        "key_symptom_notes": "Abdominal pain, loss of appetite, vomiting"
    },
    {
        "category": "Gastrointestinal (Gastroenteritis)",
        "symptoms": ["vomiting", "sunken_eyes", "dehydration", "diarrhoea"],
        "expected_diseases": ["Gastroenteritis"],
        "key_symptom_notes": "Diarrhea, vomiting, sunken eyes, dehydration"
    },
    {
        "category": "Cardiovascular & Endocrine (Diabetes)",
        "symptoms": ["fatigue", "weight_loss", "restlessness", "lethargy", "irregular_sugar_level", "blurred_and_distorted_vision", "obesity", "excessive_hunger", "increased_appetite", "polyuria"],
        "expected_diseases": ["Diabetes "],
        "key_symptom_notes": "Polyuria, excessive hunger, irregular sugar level"
    },
    {
        "category": "Cardiovascular & Endocrine (Heart Attack)",
        "symptoms": ["vomiting", "breathlessness", "sweating", "chest_pain"],
        "expected_diseases": ["Heart attack"],
        "key_symptom_notes": "Chest pain, breathlessness, sweating"
    },
    {
        "category": "Cardiovascular & Endocrine (Hyperthyroidism)",
        "symptoms": ["fatigue", "mood_swings", "weight_loss", "restlessness", "sweating", "diarrhoea", "fast_heart_rate", "excessive_hunger", "muscle_weakness", "irritability", "abnormal_menstruation"],
        "expected_diseases": ["Hyperthyroidism"],
        "key_symptom_notes": "Weight loss with increased appetite, fast heart rate, tremors"
    },
    {
        "category": "Cardiovascular & Endocrine (Hypothyroidism)",
        "symptoms": ["fatigue", "weight_gain", "cold_hands_and_feets", "mood_swings", "lethargy", "dizziness", "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "depression", "abnormal_menstruation"],
        "expected_diseases": ["Hypothyroidism"],
        "key_symptom_notes": "Weight gain, cold intolerance, enlarged thyroid, lethargy"
    },
    {
        "category": "Dermatology (Fungal Infection)",
        "symptoms": ["itching", "skin_rash", "nodal_skin_eruptions", "dischromic _patches"],
        "expected_diseases": ["Fungal infection"],
        "key_symptom_notes": "Itching, skin rash, nodal skin eruptions"
    },
    {
        "category": "Dermatology (Psoriasis)",
        "symptoms": ["skin_rash", "joint_pain", "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails"],
        "expected_diseases": ["Psoriasis"],
        "key_symptom_notes": "Silver like dusting, skin peeling, inflammatory nails"
    },
    {
        "category": "Dermatology (Impetigo)",
        "symptoms": ["skin_rash", "high_fever", "blister", "red_sore_around_nose", "yellow_crust_ooze"],
        "expected_diseases": ["Impetigo"],
        "key_symptom_notes": "Red sore around nose, yellow crust ooze, blister"
    },
    {
        "category": "Neurological & Musculoskeletal (Arthritis)",
        "symptoms": ["muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "painful_walking"],
        "expected_diseases": ["Arthritis"],
        "key_symptom_notes": "Swelling joints, movement stiffness, painful walking"
    },
    {
        "category": "Neurological & Musculoskeletal (Migraine / Headache)",
        "symptoms": ["acidity", "indigestion", "headache", "blurred_and_distorted_vision", "excessive_hunger", "stiff_neck", "depression", "irritability", "visual_disturbances"],
        "expected_diseases": ["Migraine", "headache"],
        "key_symptom_notes": "Visual disturbances, headache, irritability"
    },
    {
        "category": "Neurological & Musculoskeletal (Vertigo - BPPV)",
        "symptoms": ["vomiting", "headache", "nausea", "spinning_movements", "loss_of_balance", "unsteadiness"],
        "expected_diseases": ["(vertigo) Paroymsal  Positional Vertigo"],
        "key_symptom_notes": "Spinning movements, loss of balance, unsteadiness"
    },
    {
        "category": "Urology (Urinary Tract Infection)",
        "symptoms": ["burning_micturition", "bladder_discomfort", "foul_smell_of urine", "continuous_feel_of_urine"],
        "expected_diseases": ["Urinary tract infection"],
        "key_symptom_notes": "Burning micturition, foul smell of urine, continuous feel"
    }
]

def run_tests():
    total = len(TEST_CASES)
    passed = 0

    print(f"===========================================================")
    print(f"RUNNING RIGOROUS CLINICAL END-TO-END VALIDATION ({total} TESTS)")
    print(f"===========================================================\n")

    # Check server availability first
    try:
        requests.get(f"{BASE_URL}/symptoms", timeout=2)
    except Exception:
        print("❌ ERROR: The backend FastAPI server is NOT running on http://127.0.0.1:8000")
        print("Please start the backend server in another terminal window first:")
        print("   cd backend && python -m uvicorn app.main:app --reload --port 8000\n")
        sys.exit(1)

    for idx, tc in enumerate(TEST_CASES, 1):
        # 1. Diagnose
        diag_payload = {"symptoms": tc["symptoms"], "language": "en"}
        try:
            diag_res = requests.post(f"{BASE_URL}/diagnose", json=diag_payload, timeout=5)
            if diag_res.status_code != 200:
                print(f"[FAIL] Test {idx:02d}: {tc['category']} (HTTP {diag_res.status_code})")
                continue
            diag_data = diag_res.json()
            predicted_disease = diag_data["disease_name"]
            disease_id = diag_data["disease_id"]
            confidence = diag_data["confidence"]
        except Exception as e:
            print(f"[FAIL] Test {idx:02d}: {tc['category']} ({str(e)})")
            continue

        # Check prediction match
        is_pred_valid = any(exp.lower().strip() in predicted_disease.lower().strip() or predicted_disease.lower().strip() in exp.lower().strip() for exp in tc["expected_diseases"])

        # 2. Medicines Catalog Check
        try:
            med_res = requests.get(f"{BASE_URL}/medicines/{disease_id}?language=en", timeout=5)
            has_medicines = (med_res.status_code == 200 and len(med_res.json().get("medicines", [])) > 0)
            med_list = med_res.json().get("medicines", []) if med_res.status_code == 200 else []
            med_ids = [m["id"] for m in med_list]
        except Exception as e:
            has_medicines = False
            med_ids = []

        # 3. Prescription Check
        has_prescription = False
        if has_medicines and med_ids:
            try:
                rx_payload = {
                    "disease_id": disease_id,
                    "disease_name": predicted_disease,
                    "medicines": med_ids,
                    "language": "en"
                }
                rx_res = requests.post(f"{BASE_URL}/generate-prescription", json=rx_payload, timeout=5)
                has_prescription = (rx_res.status_code == 200 and len(rx_res.json().get("medicines", [])) > 0)
            except Exception:
                has_prescription = False

        status = "PASS" if (is_pred_valid and has_medicines and has_prescription) else "FAIL"
        if status == "PASS":
            passed += 1

        print(f"[{status}] Test {idx:02d}: {tc['category']}")
        print(f"   Symptoms : {', '.join(tc['symptoms'][:4])}...")
        print(f"   Predicted: '{predicted_disease}' (ID: {disease_id}) [Confidence: {confidence*100:.1f}%]")
        print(f"   Expected : {tc['expected_diseases']}")
        print(f"   Medicines: {len(med_ids)} items found ({', '.join([m['name_en'] for m in med_list[:2]])})")
        print(f"   Rx Valid : {'Yes' if has_prescription else 'No'}")
        print("-" * 60)

    print(f"\n===========================================================")
    print(f"FINAL RESULT: {passed}/{total} PASSED ({(passed/total)*100:.1f}%)")
    print(f"===========================================================")

if __name__ == "__main__":
    run_tests()
