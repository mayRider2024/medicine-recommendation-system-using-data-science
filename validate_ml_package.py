#!/usr/bin/env python3
"""
STEP 2B — Complete validation of CureAI ML package.
This script runs directly without external Bash commands.
Do NOT modify any existing code, just validate the ML package.
"""

import json
import sys
import traceback
import warnings
import platform
from pathlib import Path

# Colors for output (optional, just for readability)
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
ENDC = "\033[0m"
BOLD = "\033[1m"

BASE_DIR = Path(__file__).parent
BACKEND_DIR = BASE_DIR / "backend"
ML_DIR = BACKEND_DIR / "app" / "models" / "CureAI_ML_COMPLETE"
ARTIFACTS_DIR = ML_DIR / "artifacts"

# Helper functions
def log_success(msg): print(f"{GREEN}✓{ENDC} {msg}")
def log_error(msg): print(f"{RED}✗{ENDC} {msg}")
def log_warning(msg): print(f"{YELLOW}⚠{ENDC} {msg}")
def log_info(msg): print(f"{BLUE}ℹ{ENDC} {msg}")

def main():
    print("=" * 80)
    print(f"{BOLD}STEP 2B — CureAI ML Package Validation{ENDC}")
    print("=" * 80)
    print(f"Project: {BASE_DIR.name}")
    print(f"Working directory: {BASE_DIR}")
    print()

    # 1. System Information
    print(f"{BOLD}1. System Information{ENDC}")
    print(f"Python version: {platform.python_version()}")
    print(f"Python executable: {sys.executable}")
    print(f"Platform: {platform.system()} {platform.release()}")
    print()

    # 2. Check for required packages
    print(f"{BOLD}2. Checking required packages{ENDC}")
    required_packages = ["numpy", "scikit-learn", "joblib"]
    packages_info = {}

    for pkg in required_packages:
        try:
            if pkg == "scikit-learn":
                import sklearn
                packages_info[pkg] = sklearn.__version__
                log_success(f"{pkg}: {sklearn.__version__}")
            elif pkg == "numpy":
                import numpy
                packages_info[pkg] = numpy.__version__
                log_success(f"{pkg}: {numpy.__version__}")
            elif pkg == "joblib":
                import joblib
                packages_info[pkg] = joblib.__version__
                log_success(f"{pkg}: {joblib.__version__}")
        except ImportError as e:
            packages_info[pkg] = None
            log_error(f"{pkg}: NOT INSTALLED ({e})")

    if None in packages_info.values():
        log_error("Missing required packages. Cannot proceed with validation.")
        return 1

    print()

    # 3. Load artifacts
    print(f"{BOLD}3. Loading ML Artifacts{ENDC}")

    # 3.1 Load model
    model_path = ARTIFACTS_DIR / "cureai_disease_model.joblib"
    try:
        from joblib import load as joblib_load
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            model = joblib_load(model_path)
            for warning in w:
                log_warning(f"Model load warning: {warning.message}")
        log_success(f"Model loaded: {type(model).__name__} from {type(model).__module__}")
    except Exception as e:
        log_error(f"Failed to load model: {e}")
        print(traceback.format_exc())
        return 1

    # 3.2 Load label encoder
    encoder_path = ARTIFACTS_DIR / "label_encoder.joblib"
    try:
        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            label_encoder = joblib_load(encoder_path)
            for warning in w:
                log_warning(f"Label encoder load warning: {warning.message}")
        log_success(f"Label encoder loaded: {type(label_encoder).__name__}")
    except Exception as e:
        log_error(f"Failed to load label encoder: {e}")
        print(traceback.format_exc())
        return 1

    # 3.3 Load feature names
    features_path = ARTIFACTS_DIR / "feature_names.json"
    try:
        with open(features_path, "r") as f:
            feature_names = json.load(f)
        log_success(f"Feature names loaded: {len(feature_names)} features")
    except Exception as e:
        log_error(f"Failed to load feature names: {e}")
        print(traceback.format_exc())
        return 1

    print()

    # 4. Model details
    print(f"{BOLD}4. Model Details{ENDC}")

    # 4.1 Basic model info
    model_details = {}
    for attr in ["n_estimators", "n_features_in_", "n_classes_", "max_depth", "random_state"]:
        if hasattr(model, attr):
            model_details[attr] = getattr(model, attr)
            log_info(f"{attr}: {model_details[attr]}")

    # 4.2 Check model.classes_ (should be 0..n_classes-1)
    if hasattr(model, "classes_"):
        log_info(f"Model classes: {list(model.classes_)}")

    # 4.3 Check predict_proba
    import numpy as np
    test_input = np.zeros((1, len(feature_names)), dtype=float)
    try:
        probabilities = model.predict_proba(test_input)
        log_info(f"Predict_proba shape: {probabilities.shape}")
        log_info(f"Predict_proba range: {probabilities.min():.4f} - {probabilities.max():.4f}")
    except Exception as e:
        log_error(f"Predict_proba failed: {e}")

    print()

    # 5. Label encoder details
    print(f"{BOLD}5. Label Encoder Details{ENDC}")
    log_info(f"Label encoder classes: {len(label_encoder.classes_)}")

    # Print all classes with proper formatting
    print("All LabelEncoder classes (in original order):")
    for i, class_name in enumerate(label_encoder.classes_):
        # Display with index for clarity
        print(f"  [{i:3d}] {class_name}")

    # 5.1 Test basic functionality
    print(f"{BOLD}6. Basic Functionality Tests{ENDC}")

    # Test 1: Predict on empty input
    try:
        prediction = model.predict(test_input)
        log_info(f"Empty input prediction: {prediction}")

        # Test 2: Inverse transform
        inverse_prediction = label_encoder.inverse_transform(prediction)
        log_info(f"Empty input inverse transform: {inverse_prediction}")

        # Test 3: Predict on a known feature
        if "cough" in feature_names:
            cough_input = np.zeros((1, len(feature_names)), dtype=float)
            cough_input[0, feature_names.index("cough")] = 1.0
            cough_pred = model.predict(cough_input)
            cough_inverse = label_encoder.inverse_transform(cough_pred)
            log_info(f"'cough' prediction: {cough_pred[0]} -> {cough_inverse[0]}")
    except Exception as e:
        log_error(f"Basic functionality test failed: {e}")
        print(traceback.format_exc())

    print()

    # 7. Feature names
    print(f"{BOLD}7. All 132 Feature Names{ENDC}")
    print("(Printed in original order from feature_names.json)")
    print()
    for i, feature_name in enumerate(feature_names):
        print(f"{i:3d:3d}. {feature_name}")

    print()

    # 8. Load model_service and test predictions
    print(f"{BOLD}8. Model Service Tests{ENDC}")

    try:
        sys.path.insert(0, str(ML_DIR))
        import model_service as ms
        log_info(f"Model service loaded successfully")
        log_info(f"Model service FEATURE_NAMES count: {len(ms.FEATURE_NAMES)}")
        log_info(f"Model service ALIASES loaded")
    except Exception as e:
        log_error(f"Failed to load model_service: {e}")
        print(traceback.format_exc())
        return 1

    # 8.1 Test with individual symptoms
    test_symptoms = [
        ["cough"], ["headache"], ["nausea"], ["chest_pain"], ["runny_nose"],
        ["diarrhea"], ["rash"], ["shortness_of_breath"], ["fever"], ["sore_throat"],
        ["body_ache"], ["sneezing"], ["insomnia"]
    ]

    # 8.2 Test with CureAI test cases
    cureai_test_cases = [
        ["fever"],
        ["cough", "sore_throat"],
        ["fever", "body_ache", "headache"],
        ["cough", "runny_nose", "sneezing"],
        ["shortness_of_breath", "chest_pain"],
        ["headache", "fatigue"],
        ["runny_nose", "sneezing", "headache"],
        ["fever", "cough", "sore_throat", "body_ache"],
        ["nausea", "diarrhea"],
        ["rash", "insomnia"]
    ]

    def format_symptoms(symptoms):
        """Format symptoms for output"""
        return symptoms if isinstance(symptoms, list) else [symptoms]

    def get_expanded_symptoms(symptoms, service_module):
        """Get expanded symptoms using model_service logic"""
        wanted = set()
        for s in symptoms:
            key = str(s).strip().lower().replace(" ", "_").replace("-", "_")
            wanted.update(service_module.ALIASES.get(key, [key]))
        return sorted(wanted)

    # Test all cases
    all_test_cases = test_symptoms + cureai_test_cases
    all_test_cases = [format_symptoms(symptoms) for symptoms in all_test_cases]

    for symptoms in all_test_cases:
        try:
            result = ms.predict_disease(symptoms, top_k=3)

            # Get expanded symptoms
            expanded = get_expanded_symptoms(symptoms, ms)

            # Get vectorized representation
            vector = ms.vectorize(symptoms)
            nonzero_features = [ms.FEATURE_NAMES[i] for i, v in enumerate(vector[0]) if v]

            print(f"Input: {symptoms}")
            print(f"  Expanded: {expanded}")
            print(f"  Non-zero features: {nonzero_features}")
            print(f"  Supported: {result['supported']}")
            print(f"  Prediction: {result['prediction']}")
            print(f"  Confidence: {result['confidence']}")
            print(f"  Top predictions: {result['top_predictions']}")
            print()

        except Exception as e:
            print(f"Input: {symptoms}")
            print(f"  ERROR: {e}")
            print()

    # 9. Fever specific test
    print(f"{BOLD}9. Fever Test{ENDC}")
    fever_test = ["fever"]

    try:
        fever_result = ms.predict_disease(fever_test, top_k=3)
        expanded_fever = get_expanded_symptoms(fever_test, ms)
        vector_fever = ms.vectorize(fever_test)
        nonzero_fever = [ms.FEATURE_NAMES[i] for i, v in enumerate(vector_fever[0]) if v]

        print(f"Input: {fever_test}")
        print(f"  Expanded: {expanded_fever}")
        print(f"  Non-zero features: {nonzero_fever}")
        print(f"  Supported: {fever_result['supported']}")
        print(f"  Prediction: {fever_result['prediction']}")
        print(f"  Confidence: {fever_result['confidence']}")
        print(f"  Top predictions: {fever_result['top_predictions']}")
    except Exception as e:
        print(f"Fever test failed: {e}")

    print()

    # 10. Disease mapping analysis
    print(f"{BOLD}10. Disease Mapping Analysis{ENDC}")

    # Get all unique predictions from model_service tests
    ml_diseases = set()
    for symptoms in all_test_cases:
        try:
            result = ms.predict_disease(symptoms, top_k=3)
            if result['supported']:
                ml_diseases.add(result['prediction'])
        except:
            pass

    print(f"ML diseases predicted: {len(ml_diseases)}")
    for disease in sorted(ml_diseases):
        print(f"  - {disease}")

    # Known CureAI disease IDs
    cureai_disease_ids = [
        "cold", "fever", "common_ailment", "headache", "flu",
        "cough", "allergy", "gastroenteritis", "dysentery", "asthma", "hypertension"
    ]

    print(f"\nCureAI disease IDs: {cureai_disease_ids}")

    # Mapping candidates
    print(f"\nPossible ML → CureAI disease mappings:")
    for ml_disease in sorted(ml_diseases):
        # Simple string matching for obvious cases
        if ml_disease.lower() in [d.lower() for d in cureai_disease_ids]:
            matched = [d for d in cureai_disease_ids if d.lower() == ml_disease.lower()][0]
            print(f"  {ml_disease} → {matched}")
        else:
            print(f"  {ml_disease} → (NO MATCH)")

    print()

    # 11. Medicine compatibility
    print(f"{BOLD}11. Medicine Compatibility{ENDC}")

    # Load medicines data
    try:
        sys.path.insert(0, str(BACKEND_DIR / "app"))
        from models.disease_database import MedicineDatabase

        # Create database instance
        db = MedicineDatabase()

        print("Available CureAI disease IDs with medicine mappings:")
        for disease_id in cureai_disease_ids:
            try:
                medicines = db.get_medicines_for_disease(disease_id)
                print(f"  {disease_id}: {len(medicines)} medicines")
            except Exception:
                print(f"  {disease_id}: (no medicines available)")

        print(f"\nML diseases with NO CureAI medicine mapping:")
        for ml_disease in sorted(ml_diseases):
            # Check if there's a match
            matched = None
            for cureai_id in cureai_disease_ids:
                if cureai_id.lower() == ml_disease.lower():
                    matched = cureai_id
                    break

            if not matched:
                print(f"  {ml_disease}: (NO MEDICINE MAPPING)")

    except Exception as e:
        log_error(f"Could not load medicine database: {e}")

    print()
    print("=" * 80)
    print("VALIDATION COMPLETE")
    print("=" * 80)

    return 0

if __name__ == "__main__":
    exit(main())