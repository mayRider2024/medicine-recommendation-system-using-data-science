from fastapi import APIRouter, HTTPException
from typing import List, Dict
from dataclasses import dataclass

router = APIRouter()

@dataclass
class MedicineDetail:
    id: str
    name_en: str
    name_hi: str
    generic_name: str
    dosage: str
    duration_days: int
    frequency: str
    meal_instruction: str

@dataclass
class MedicinesResponse:
    disease_id: str
    disease_name: str
    medicines: List[MedicineDetail]
    language: str

# Catalog of medicines for all conditions (including the 41 ML model diseases)
MOCK_MEDICINES: Dict[str, List[dict]] = {
    # 1. Common Cold / Flu / Respiratory
    "cold": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 3,
            "frequency": "3 times daily",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "cetirizine",
            "name_en": "Cetirizine",
            "name_hi": "सेटीरिजीन",
            "generic_name": "Cetirizine Hydrochloride",
            "dosage": "10mg",
            "duration_days": 5,
            "frequency": "Once daily at night",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "fever": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 3,
            "frequency": "Every 4-6 hours, max 4000mg/day",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "ibuprofen",
            "name_en": "Ibuprofen",
            "name_hi": "आइबुप्रोफेन",
            "generic_name": "Ibuprofen",
            "dosage": "400mg",
            "duration_days": 3,
            "frequency": "Every 6-8 hours",
            "meal_instruction": "Take with food to avoid stomach upset"
        }
    ],
    "cough": [
        {
            "id": "cough_syrup",
            "name_en": "Cough Syrup",
            "name_hi": "खांसी की दवा",
            "generic_name": "Dextromethorphan + Phenylephrine",
            "dosage": "10ml",
            "duration_days": 5,
            "frequency": "Twice daily (10ml each)",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "flu": [
        {
            "id": "oseltamivir",
            "name_en": "Oseltamivir (Tamiflu)",
            "name_hi": "ऑसेल्टामिविर",
            "generic_name": "Oseltamivir",
            "dosage": "75mg",
            "duration_days": 5,
            "frequency": "Twice daily",
            "meal_instruction": "Take with food"
        },
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 5,
            "frequency": "Every 4-6 hours",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "asthma": [
        {
            "id": "salbutamol",
            "name_en": "Salbutamol Inhaler",
            "name_hi": "साल्बुटामोल इनहेलर",
            "generic_name": "Albuterol/Salbutamol",
            "dosage": "100 mcg/puff",
            "duration_days": 30,
            "frequency": "1-2 puffs as needed during attacks",
            "meal_instruction": "Inhaled medication"
        },
        {
            "id": "theophylline",
            "name_en": "Theophylline",
            "name_hi": "थिओफिलिन",
            "generic_name": "Theophylline",
            "dosage": "250mg",
            "duration_days": 30,
            "frequency": "Twice daily",
            "meal_instruction": "Take with or without food consistently"
        }
    ],
    "pneumonia": [
        {
            "id": "amoxicillin_clavulanate",
            "name_en": "Augmentin (Amoxicillin-Clavulanate)",
            "name_hi": "ऑगमेंटिन (एमोक्सिसिलिन)",
            "generic_name": "Amoxicillin + Clavulanic Acid",
            "dosage": "625mg",
            "duration_days": 7,
            "frequency": "Twice daily with meals",
            "meal_instruction": "Take at the start of a meal"
        },
        {
            "id": "azithromycin",
            "name_en": "Azithromycin",
            "name_hi": "एज़िथ्रोमाइसिन",
            "generic_name": "Azithromycin",
            "dosage": "500mg",
            "duration_days": 3,
            "frequency": "Once daily",
            "meal_instruction": "Take 1 hour before or 2 hours after food"
        }
    ],
    "tuberculosis": [
        {
            "id": "anti_tb_kit",
            "name_en": "4-Drug Fixed Dose Combination (HRZE)",
            "name_hi": "एंटी-टीबी किट",
            "generic_name": "Isoniazid + Rifampicin + Pyrazinamide + Ethambutol",
            "dosage": "Weight-based regimen",
            "duration_days": 60,
            "frequency": "Once daily in the morning",
            "meal_instruction": "Take on an empty stomach 1 hour before breakfast"
        }
    ],

    # 2. Hepatic & Biliary Diseases
    "hepatitis_a": [
        {
            "id": "supportive_hep_a",
            "name_en": "Supportive Care & Hydration (ORS / Multivitamin)",
            "name_hi": "ओआरएस और मल्टीविटामिन",
            "generic_name": "Electrolytes + B-Complex",
            "dosage": "1 sachet / 1 tablet",
            "duration_days": 14,
            "frequency": "Daily as needed",
            "meal_instruction": "After light meals"
        },
        {
            "id": "ondansetron",
            "name_en": "Ondansetron",
            "name_hi": "ओन्डैनसेट्रॉन",
            "generic_name": "Ondansetron",
            "dosage": "4mg",
            "duration_days": 5,
            "frequency": "Twice daily before meals for nausea",
            "meal_instruction": "Take 30 minutes before food"
        }
    ],
    "hepatitis_b": [
        {
            "id": "tenofovir",
            "name_en": "Tenofovir Disoproxil",
            "name_hi": "टेनोफोविर",
            "generic_name": "Tenofovir Disoproxil Fumarate",
            "dosage": "300mg",
            "duration_days": 90,
            "frequency": "Once daily",
            "meal_instruction": "Take with food"
        },
        {
            "id": "entecavir",
            "name_en": "Entecavir",
            "name_hi": "एंतेकाविर",
            "generic_name": "Entecavir",
            "dosage": "0.5mg",
            "duration_days": 90,
            "frequency": "Once daily on empty stomach",
            "meal_instruction": "Take at least 2 hours after a meal"
        }
    ],
    "hepatitis_c": [
        {
            "id": "sofosbuvir_velpatasvir",
            "name_en": "Sofosbuvir + Velpatasvir",
            "name_hi": "सोफोसबुविर + वेलपटासवीर",
            "generic_name": "Sofosbuvir 400mg + Velpatasvir 100mg",
            "dosage": "1 tablet",
            "duration_days": 84,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "hepatitis_d": [
        {
            "id": "peginterferon_alfa",
            "name_en": "Pegylated Interferon Alfa-2a",
            "name_hi": "पेगिलेटेड इंटरफेरॉन",
            "generic_name": "Peginterferon Alfa-2a",
            "dosage": "180 mcg weekly",
            "duration_days": 48,
            "frequency": "Once weekly via subcutaneous injection",
            "meal_instruction": "Administer under physician supervision"
        },
        {
            "id": "ursodeoxycholic_acid",
            "name_en": "Ursodeoxycholic Acid (UDCA)",
            "name_hi": "उर्सोडीऑक्सीकोलिक एसिड",
            "generic_name": "Ursodiol",
            "dosage": "300mg",
            "duration_days": 30,
            "frequency": "Twice daily with meals",
            "meal_instruction": "Take with meals"
        }
    ],
    "hepatitis_e": [
        {
            "id": "supportive_hep_e",
            "name_en": "Supportive Care & Fluid Replacement",
            "name_hi": "सपोर्टिव केयर और ओआरएस",
            "generic_name": "Oral Rehydration Salts + Liver Support",
            "dosage": "1 sachet in 1L water",
            "duration_days": 10,
            "frequency": "Throughout the day",
            "meal_instruction": "Between meals"
        }
    ],
    "alcoholic_hepatitis": [
        {
            "id": "prednisolone",
            "name_en": "Prednisolone",
            "name_hi": "प्रेडनिसोलोन",
            "generic_name": "Prednisolone",
            "dosage": "40mg",
            "duration_days": 28,
            "frequency": "Once daily in morning",
            "meal_instruction": "Take with breakfast"
        },
        {
            "id": "thiamine_b_complex",
            "name_en": "Thiamine & B-Complex Supplement",
            "name_hi": "विटामिन बी-कॉम्प्लेक्स",
            "generic_name": "Thiamine Hydrochloride (Vitamin B1)",
            "dosage": "100mg",
            "duration_days": 30,
            "frequency": "Once daily",
            "meal_instruction": "After meals"
        }
    ],
    "jaundice": [
        {
            "id": "ursodeoxycholic_acid",
            "name_en": "Ursodeoxycholic Acid (UDCA)",
            "name_hi": "उर्सोडीऑक्सीकोलिक एसिड",
            "generic_name": "Ursodiol",
            "dosage": "300mg",
            "duration_days": 14,
            "frequency": "Twice daily",
            "meal_instruction": "Take with food"
        },
        {
            "id": "silymarin",
            "name_en": "Silymarin (Milk Thistle Extract)",
            "name_hi": "सिलीमारिन",
            "generic_name": "Silymarin",
            "dosage": "140mg",
            "duration_days": 30,
            "frequency": "Twice daily",
            "meal_instruction": "After meals"
        }
    ],
    "chronic_cholestasis": [
        {
            "id": "ursodeoxycholic_acid",
            "name_en": "Ursodeoxycholic Acid (UDCA)",
            "name_hi": "उर्सोडीऑक्सीकोलिक एसिड",
            "generic_name": "Ursodiol",
            "dosage": "300mg",
            "duration_days": 30,
            "frequency": "2-3 times daily",
            "meal_instruction": "Take with meals"
        },
        {
            "id": "cholestyramine",
            "name_en": "Cholestyramine",
            "name_hi": "कोलेस्टिरमाइन",
            "generic_name": "Cholestyramine Powder",
            "dosage": "4g sachet",
            "duration_days": 14,
            "frequency": "Once to twice daily",
            "meal_instruction": "Take before meals with water"
        }
    ],

    # 3. Gastrointestinal
    "gerd": [
        {
            "id": "pantoprazole",
            "name_en": "Pantoprazole",
            "name_hi": "पेंटोप्रामोल",
            "generic_name": "Pantoprazole Sodium",
            "dosage": "40mg",
            "duration_days": 14,
            "frequency": "Once daily before breakfast",
            "meal_instruction": "Take 30 minutes before first meal of day"
        },
        {
            "id": "antacid_gel",
            "name_en": "Antacid Liquid Gel",
            "name_hi": "एंटासिड जेल",
            "generic_name": "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone",
            "dosage": "10ml",
            "duration_days": 7,
            "frequency": "As needed after meals and bedtime",
            "meal_instruction": "Take after meals"
        }
    ],
    "peptic_ulcer_diseae": [
        {
            "id": "rabeprazole_domperidone",
            "name_en": "Rabeprazole + Domperidone",
            "name_hi": "राबेप्राजोल + डोमपेरिडोन",
            "generic_name": "Rabeprazole 20mg + Domperidone 30mg",
            "dosage": "1 capsule",
            "duration_days": 14,
            "frequency": "Once daily in morning",
            "meal_instruction": "Take on empty stomach 30 mins before breakfast"
        },
        {
            "id": "sucralfate",
            "name_en": "Sucralfate Suspension",
            "name_hi": "सुक्रालफेट",
            "generic_name": "Sucralfate",
            "dosage": "1000mg (10ml)",
            "duration_days": 14,
            "frequency": "Twice daily 1 hour before meals",
            "meal_instruction": "Take 1 hour before meals"
        }
    ],
    "gastroenteritis": [
        {
            "id": "domperidone",
            "name_en": "Domperidone",
            "name_hi": "डोमपेरिडोन",
            "generic_name": "Domperidone",
            "dosage": "10mg",
            "duration_days": 5,
            "frequency": "3 times daily",
            "meal_instruction": "Take 30 minutes before meals"
        },
        {
            "id": "ors",
            "name_en": "ORS Solution",
            "name_hi": "ओआरएस घोल",
            "generic_name": "Oral Rehydration Salts",
            "dosage": "1 sachet in 1L water",
            "duration_days": 3,
            "frequency": "Sip frequently throughout the day",
            "meal_instruction": "Between meals"
        }
    ],
    "dysentery": [
        {
            "id": "ciprofloxacin",
            "name_en": "Ciprofloxacin",
            "name_hi": "सिप्रोफ्लोक्सासिन",
            "generic_name": "Ciprofloxacin",
            "dosage": "500mg",
            "duration_days": 5,
            "frequency": "Twice daily",
            "meal_instruction": "Take 2 hours before or after meals"
        },
        {
            "id": "metronidazole",
            "name_en": "Metronidazole",
            "name_hi": "मेट्रोनिडाजोल",
            "generic_name": "Metronidazole",
            "dosage": "400mg",
            "duration_days": 5,
            "frequency": "3 times daily",
            "meal_instruction": "Take after meals"
        }
    ],
    "dimorphic_hemmorhoids(piles)": [
        {
            "id": "daflon",
            "name_en": "Micronized Flavonoid (Daflon)",
            "name_hi": "डाफ्लॉन",
            "generic_name": "Purified Flavonoid Fraction 500mg",
            "dosage": "500mg",
            "duration_days": 14,
            "frequency": "Twice daily with meals",
            "meal_instruction": "Take with meals"
        },
        {
            "id": "stool_softener",
            "name_en": "Lactulose / Ispaghula Husk",
            "name_hi": "इसबगोल / लैक्टुलोज",
            "generic_name": "Lactulose Solution",
            "dosage": "15ml",
            "duration_days": 7,
            "frequency": "Once daily at bedtime with water",
            "meal_instruction": "At bedtime"
        }
    ],

    # 4. Infections & Vector-borne
    "malaria": [
        {
            "id": "artemether_lumefantrine",
            "name_en": "Artemether + Lumefantrine (Coartem)",
            "name_hi": "आर्टेमीथर + लूमेफैंट्रिन",
            "generic_name": "Artemether 20mg + Lumefantrine 120mg",
            "dosage": "4 tablets",
            "duration_days": 3,
            "frequency": "Twice daily with milk or fatty meal",
            "meal_instruction": "Take with food or drinks containing fat"
        },
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 3,
            "frequency": "Every 6 hours for fever",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "dengue": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol (Avoid NSAIDs/Aspirin)",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 5,
            "frequency": "Every 6 hours as needed for fever",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "ors",
            "name_en": "ORS & Platelet Support Electrolytes",
            "name_hi": "ओआरएस और तरल पदार्थ",
            "generic_name": "Oral Rehydration Salts",
            "dosage": "1 sachet in 1L water",
            "duration_days": 7,
            "frequency": "Drink 2-3 liters daily",
            "meal_instruction": "Throughout the day"
        }
    ],
    "typhoid": [
        {
            "id": "azithromycin_typhoid",
            "name_en": "Azithromycin",
            "name_hi": "एज़िथ्रोमाइसिन",
            "generic_name": "Azithromycin",
            "dosage": "500mg",
            "duration_days": 7,
            "frequency": "Once daily",
            "meal_instruction": "Take 1 hour before or 2 hours after meals"
        },
        {
            "id": "cefixime",
            "name_en": "Cefixime",
            "name_hi": "सेफिक्सिम",
            "generic_name": "Cefixime",
            "dosage": "200mg",
            "duration_days": 10,
            "frequency": "Twice daily",
            "meal_instruction": "Take after meals"
        }
    ],
    "chicken_pox": [
        {
            "id": "acyclovir",
            "name_en": "Acyclovir",
            "name_hi": "एसिक्लोविर",
            "generic_name": "Acyclovir",
            "dosage": "800mg",
            "duration_days": 5,
            "frequency": "4-5 times daily (every 4 hours)",
            "meal_instruction": "Take with a full glass of water"
        },
        {
            "id": "calamine_lotion",
            "name_en": "Calamine Lotion + Antihistamine",
            "name_hi": "कैलामाइन लोशन",
            "generic_name": "Calamine Topical + Cetirizine 10mg",
            "dosage": "Apply topically / 1 tablet at night",
            "duration_days": 7,
            "frequency": "2-3 times daily for soothing itching",
            "meal_instruction": "Apply to clean, dry rash areas"
        }
    ],
    "fungal_infection": [
        {
            "id": "fluconazole",
            "name_en": "Fluconazole",
            "name_hi": "फ्लूकोनाजोल",
            "generic_name": "Fluconazole",
            "dosage": "150mg",
            "duration_days": 4,
            "frequency": "Once weekly",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "clotrimazole_cream",
            "name_en": "Clotrimazole Topical Cream",
            "name_hi": "क्लोट्रिमाजोल क्रीम",
            "generic_name": "Clotrimazole 1%",
            "dosage": "Apply thin layer",
            "duration_days": 14,
            "frequency": "Twice daily to affected area",
            "meal_instruction": "External use only"
        }
    ],
    "urinary_tract_infection": [
        {
            "id": "nitrofurantoin",
            "name_en": "Nitrofurantoin",
            "name_hi": "नाइट्रोफ्यूरेंटॉइन",
            "generic_name": "Nitrofurantoin Monohydrate",
            "dosage": "100mg",
            "duration_days": 5,
            "frequency": "Twice daily with meals",
            "meal_instruction": "Take with food or milk"
        },
        {
            "id": "urinary_alkalizer",
            "name_en": "Disodium Hydrogen Citrate Syrup",
            "name_hi": "यूरिनरी अल्कालाइजर सिरप",
            "generic_name": "Disodium Hydrogen Citrate",
            "dosage": "10ml in glass of water",
            "duration_days": 5,
            "frequency": "3 times daily",
            "meal_instruction": "After meals"
        }
    ],

    # 5. Dermatology
    "acne": [
        {
            "id": "benzoyl_peroxide_gel",
            "name_en": "Benzoyl Peroxide Gel 2.5%",
            "name_hi": "बेंजोइल पेरोक्साइड जेल",
            "generic_name": "Benzoyl Peroxide",
            "dosage": "Apply thin layer",
            "duration_days": 30,
            "frequency": "Once daily at night",
            "meal_instruction": "Apply on clean dry skin"
        },
        {
            "id": "clindamycin_gel",
            "name_en": "Clindamycin Topical Gel 1%",
            "name_hi": "क्लिंडामाइसिन जेल",
            "generic_name": "Clindamycin Phosphate",
            "dosage": "Apply thin layer",
            "duration_days": 30,
            "frequency": "Once daily in the morning",
            "meal_instruction": "External application"
        }
    ],
    "psoriasis": [
        {
            "id": "clobetasol_propionate",
            "name_en": "Clobetasol Propionate Cream",
            "name_hi": "क्लोबेटासोल क्रीम",
            "generic_name": "Clobetasol 0.05%",
            "dosage": "Apply sparingly",
            "duration_days": 14,
            "frequency": "Once to twice daily",
            "meal_instruction": "Topical application to plaques"
        },
        {
            "id": "calcipotriol",
            "name_en": "Calcipotriol Ointment",
            "name_hi": "कैल्सिपोट्रिओल मरहम",
            "generic_name": "Calcipotriene (Vitamin D3 Analogue)",
            "dosage": "Apply thin layer",
            "duration_days": 30,
            "frequency": "Twice daily",
            "meal_instruction": "External use"
        }
    ],
    "impetigo": [
        {
            "id": "mupirocin_ointment",
            "name_en": "Mupirocin 2% Ointment",
            "name_hi": "म्यूपिरोसिन ऑइंटमेंट",
            "generic_name": "Mupirocin",
            "dosage": "Apply to lesions",
            "duration_days": 7,
            "frequency": "3 times daily",
            "meal_instruction": "Wash and dry crusts before application"
        },
        {
            "id": "cephalexin",
            "name_en": "Cephalexin",
            "name_hi": "सेफैलेक्सिन",
            "generic_name": "Cephalexin",
            "dosage": "500mg",
            "duration_days": 7,
            "frequency": "4 times daily",
            "meal_instruction": "Can be taken with or without food"
        }
    ],
    "drug_reaction": [
        {
            "id": "cetirizine",
            "name_en": "Cetirizine / Levocetirizine",
            "name_hi": "सेटीरिजीन",
            "generic_name": "Levocetirizine Dihydrochloride",
            "dosage": "5mg",
            "duration_days": 7,
            "frequency": "Once daily at night",
            "meal_instruction": "Take with water"
        },
        {
            "id": "prednisone_short_course",
            "name_en": "Prednisone (Short Course)",
            "name_hi": "प्रेडनिसोन",
            "generic_name": "Prednisone",
            "dosage": "20mg tapering",
            "duration_days": 5,
            "frequency": "Once daily with breakfast",
            "meal_instruction": "Take with food; immediately stop causative drug"
        }
    ],
    "allergy": [
        {
            "id": "cetirizine",
            "name_en": "Cetirizine",
            "name_hi": "सेटीरिजीन",
            "generic_name": "Cetirizine Hydrochloride",
            "dosage": "10mg",
            "duration_days": 7,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "loratadine",
            "name_en": "Loratadine",
            "name_hi": "लोरेटाडाइन",
            "generic_name": "Loratadine",
            "dosage": "10mg",
            "duration_days": 7,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        }
    ],

    # 6. Cardiovascular & Metabolic
    "hypertension": [
        {
            "id": "amlodipine",
            "name_en": "Amlodipine",
            "name_hi": "अमलोडिपिन",
            "generic_name": "Amlodipine Besylate",
            "dosage": "5-10mg",
            "duration_days": 30,
            "frequency": "Once daily",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "telmisartan",
            "name_en": "Telmisartan",
            "name_hi": "टेल्मीसार्टन",
            "generic_name": "Telmisartan",
            "dosage": "40mg",
            "duration_days": 30,
            "frequency": "Once daily in morning",
            "meal_instruction": "Take at the same time each morning"
        }
    ],
    "heart_attack": [
        {
            "id": "aspirin_emergency",
            "name_en": "Aspirin (Dispersible)",
            "name_hi": "एस्पिरिन",
            "generic_name": "Acetylsalicylic Acid",
            "dosage": "300mg (Chewable)",
            "duration_days": 1,
            "frequency": "IMMEDIATE SINGLE DOSE - Call Emergency Services",
            "meal_instruction": "Chew tablet immediately; seek urgent ER care"
        },
        {
            "id": "clopidogrel",
            "name_en": "Clopidogrel",
            "name_hi": "क्लोपिडोग्रेल",
            "generic_name": "Clopidogrel Bisulfate",
            "dosage": "75-300mg",
            "duration_days": 30,
            "frequency": "As directed by cardiologist",
            "meal_instruction": "Take with water"
        }
    ],
    "diabetes": [
        {
            "id": "metformin",
            "name_en": "Metformin Extended Release",
            "name_hi": "मेटफॉर्मिन",
            "generic_name": "Metformin Hydrochloride",
            "dosage": "500mg - 1000mg",
            "duration_days": 30,
            "frequency": "Once or twice daily with meals",
            "meal_instruction": "Take with dinner or evening meal"
        },
        {
            "id": "glimepiride",
            "name_en": "Glimepiride",
            "name_hi": "ग्लिमेपिराइड",
            "generic_name": "Glimepiride",
            "dosage": "1mg",
            "duration_days": 30,
            "frequency": "Once daily before breakfast",
            "meal_instruction": "Take immediately before first main meal"
        }
    ],
    "hypoglycemia": [
        {
            "id": "glucose_tablets",
            "name_en": "Fast-Acting Glucose / Fruit Juice / Dextrose",
            "name_hi": "ग्लूकोज / फलों का रस",
            "generic_name": "Dextrose / Oral Glucose",
            "dosage": "15-20g fast-acting sugar",
            "duration_days": 1,
            "frequency": "Immediate oral intake, re-check blood sugar in 15 min",
            "meal_instruction": "Immediate intake on onset of shakiness/sweating"
        }
    ],
    "hyperthyroidism": [
        {
            "id": "methimazole",
            "name_en": "Methimazole",
            "name_hi": "मेथिमाज़ोल",
            "generic_name": "Methimazole / Carbimazole",
            "dosage": "10-20mg",
            "duration_days": 30,
            "frequency": "Once to twice daily",
            "meal_instruction": "Take with or without food consistently"
        },
        {
            "id": "propranolol",
            "name_en": "Propranolol",
            "name_hi": "प्रोप्रानोलोल",
            "generic_name": "Propranolol Hydrochloride",
            "dosage": "20mg",
            "duration_days": 14,
            "frequency": "2-3 times daily for palpitations/tremor",
            "meal_instruction": "Take before meals"
        }
    ],
    "hypothyroidism": [
        {
            "id": "levothyroxine",
            "name_en": "Levothyroxine Sodium (Thyroxine)",
            "name_hi": "लेवोथायरोक्सिन",
            "generic_name": "Levothyroxine Sodium",
            "dosage": "50-100 mcg",
            "duration_days": 60,
            "frequency": "Once daily on empty stomach",
            "meal_instruction": "Take 30-60 mins before breakfast with plain water"
        }
    ],

    # 7. Musculoskeletal & Neurological
    "headache": [
        {
            "id": "paracetamol",
            "name_en": "Paracetamol",
            "name_hi": "पैरासिटामोल",
            "generic_name": "Acetaminophen",
            "dosage": "500mg",
            "duration_days": 2,
            "frequency": "1-2 tablets every 4-6 hours as needed",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "sumatriptan",
            "name_en": "Sumatriptan (For Migraine)",
            "name_hi": "सुमाट्रिप्टन",
            "generic_name": "Sumatriptan Succinate",
            "dosage": "50mg",
            "duration_days": 2,
            "frequency": "1 tablet at onset of migraine attack",
            "meal_instruction": "Take with water at symptom onset"
        }
    ],
    "arthritis": [
        {
            "id": "naproxen",
            "name_en": "Naproxen",
            "name_hi": "नेप्रोक्सन",
            "generic_name": "Naproxen Sodium",
            "dosage": "250-500mg",
            "duration_days": 14,
            "frequency": "Twice daily with meals",
            "meal_instruction": "Always take with food"
        },
        {
            "id": "methotrexate",
            "name_en": "Disease Modifying Antirheumatic (Under Specialist)",
            "name_hi": "एंटी-रूमैटिक दवा",
            "generic_name": "Methotrexate",
            "dosage": "7.5-15mg weekly",
            "duration_days": 30,
            "frequency": "Once weekly only",
            "meal_instruction": "Take with folic acid on alternate days"
        }
    ],
    "osteoarthristis": [
        {
            "id": "paracetamol_er",
            "name_en": "Paracetamol Extended Release",
            "name_hi": "पैरासिटामोल ईआर",
            "generic_name": "Acetaminophen 650mg",
            "dosage": "650mg",
            "duration_days": 14,
            "frequency": "Twice to 3 times daily as needed",
            "meal_instruction": "Can be taken with or without food"
        },
        {
            "id": "glucosamine_chondroitin",
            "name_en": "Glucosamine + Chondroitin Supplement",
            "name_hi": "ग्लूकोसामाइन सप्लीमेंट",
            "generic_name": "Glucosamine Sulphate",
            "dosage": "1500mg",
            "duration_days": 60,
            "frequency": "Once daily with meals",
            "meal_instruction": "Take with breakfast or lunch"
        }
    ],
    "cervical_spondylosis": [
        {
            "id": "thiocolchicoside_etoricoxib",
            "name_en": "Etoricoxib + Thiocolchicoside",
            "name_hi": "इटोरिकॉक्सिब + थियोकोल्चिकोसाइड",
            "generic_name": "Etoricoxib 60mg + Thiocolchicoside 4mg",
            "dosage": "1 tablet",
            "duration_days": 5,
            "frequency": "Once or twice daily after meals",
            "meal_instruction": "Take with food"
        },
        {
            "id": "pregabalin_methylcobalamin",
            "name_en": "Pregabalin + Methylcobalamin",
            "name_hi": "प्रीगाबालिन + मिथाइलकोबालामिन",
            "generic_name": "Pregabalin 75mg + Mecobalamin 750mcg",
            "dosage": "1 capsule",
            "duration_days": 14,
            "frequency": "Once daily at bedtime",
            "meal_instruction": "At bedtime; may cause drowsiness"
        }
    ],
    "varicose_veins": [
        {
            "id": "micronized_flavonoids_varicose",
            "name_en": "Micronized Flavonoid Fraction (Daflon)",
            "name_hi": "डाफ्लॉन फ्लेवोनोइड",
            "generic_name": "Diosmin 450mg + Hesperidin 50mg",
            "dosage": "500mg",
            "duration_days": 30,
            "frequency": "Twice daily (midday and evening)",
            "meal_instruction": "Take with meals"
        }
    ],
    "(vertigo)_paroymsal__positional_vertigo": [
        {
            "id": "betahistine",
            "name_en": "Betahistine Dihydrochloride",
            "name_hi": "बीटाहाइस्टीन",
            "generic_name": "Betahistine",
            "dosage": "16mg",
            "duration_days": 14,
            "frequency": "Twice to 3 times daily",
            "meal_instruction": "Take after meals"
        },
        {
            "id": "cinnarizine",
            "name_en": "Cinnarizine",
            "name_hi": "सिनेरिजीन",
            "generic_name": "Cinnarizine",
            "dosage": "25mg",
            "duration_days": 7,
            "frequency": "Twice daily",
            "meal_instruction": "Take after meals"
        }
    ],
    "paralysis_(brain_hemorrhage)": [
        {
            "id": "emergency_neuro_care",
            "name_en": "Emergency Neurological Hospitalization Required",
            "name_hi": "आपातकालीन अस्पताल देखभाल",
            "generic_name": "Neuroprotective & Blood Pressure Control Regimen",
            "dosage": "ICU Protocols",
            "duration_days": 30,
            "frequency": "Under Strict Intensive Care",
            "meal_instruction": "Immediate emergency medical attention needed"
        }
    ],
    "aids": [
        {
            "id": "antiretroviral_therapy",
            "name_en": "Antiretroviral Therapy (TLD Regimen)",
            "name_hi": "एंटीरेट्रोवायरल थेरेपी (ART)",
            "generic_name": "Tenofovir + Lamivudine + Dolutegravir",
            "dosage": "1 fixed dose tablet",
            "duration_days": 90,
            "frequency": "Once daily at exact same time each day",
            "meal_instruction": "Take consistently with water"
        }
    ]
}

DISEASE_NAMES: Dict[str, Dict[str, str]] = {
    "cold": {"en": "Common Cold", "hi": "सामान्य सर्दी"},
    "fever": {"en": "Fever", "hi": "बुखार"},
    "cough": {"en": "Cough", "hi": "खांसी"},
    "flu": {"en": "Influenza (Flu)", "hi": "इन्फ्लूएंजा (फ्लू)"},
    "headache": {"en": "Headache / Migraine", "hi": "सिरदर्द / माइग्रेन"},
    "allergy": {"en": "Allergic Reaction", "hi": "एलर्जी"},
    "gastroenteritis": {"en": "Gastroenteritis", "hi": "गैस्ट्रोएंटेराइटिस (पेट का संक्रमण)"},
    "dysentery": {"en": "Dysentery", "hi": "पेचिश"},
    "asthma": {"en": "Bronchial Asthma", "hi": "दमा (अस्थमा)"},
    "hypertension": {"en": "Hypertension (High BP)", "hi": "उच्च रक्तचाप"},
    "pneumonia": {"en": "Pneumonia", "hi": "निमोनिया"},
    "tuberculosis": {"en": "Tuberculosis (TB)", "hi": "तपेदिक (टीबी)"},
    "hepatitis_a": {"en": "Hepatitis A", "hi": "हेपेटाइटिस ए"},
    "hepatitis_b": {"en": "Hepatitis B", "hi": "हेपेटाइटिस बी"},
    "hepatitis_c": {"en": "Hepatitis C", "hi": "हेपेटाइटिस सी"},
    "hepatitis_d": {"en": "Hepatitis D", "hi": "हेपेटाइटिस डी"},
    "hepatitis_e": {"en": "Hepatitis E", "hi": "हेपेटाइटिस ई"},
    "alcoholic_hepatitis": {"en": "Alcoholic Hepatitis", "hi": "अल्कोहलिक हेपेटाइटिस"},
    "jaundice": {"en": "Jaundice", "hi": "पीलिया (जॉन्डिस)"},
    "chronic_cholestasis": {"en": "Chronic Cholestasis", "hi": "क्रोनिक कोलेस्टेसिस"},
    "gerd": {"en": "GERD (Acid Reflux)", "hi": "जीईआरडी (एसिडिटी / रिफ्लक्स)"},
    "peptic_ulcer_diseae": {"en": "Peptic Ulcer Disease", "hi": "पेप्टिक अल्सर"},
    "dimorphic_hemmorhoids(piles)": {"en": "Hemorrhoids (Piles)", "hi": "बवासीर (पाइल्स)"},
    "malaria": {"en": "Malaria", "hi": "मलेरिया"},
    "dengue": {"en": "Dengue Fever", "hi": "डेंगू"},
    "typhoid": {"en": "Typhoid Fever", "hi": "टाइफाइड"},
    "chicken_pox": {"en": "Chicken Pox", "hi": "चेचक (चिकनपॉक्स)"},
    "fungal_infection": {"en": "Fungal Infection", "hi": "फंगल संक्रमण"},
    "urinary_tract_infection": {"en": "Urinary Tract Infection (UTI)", "hi": "मूत्र मार्ग संक्रमण (UTI)"},
    "acne": {"en": "Acne", "hi": "मुंहासे (एक्ने)"},
    "psoriasis": {"en": "Psoriasis", "hi": "सोरायसिस"},
    "impetigo": {"en": "Impetigo", "hi": "इम्पेटिगो (त्वचा संक्रमण)"},
    "drug_reaction": {"en": "Drug Reaction", "hi": "दवा का रिएक्शन"},
    "heart_attack": {"en": "Heart Attack (Emergency)", "hi": "दिल का दौरा (हार्ट अटैक)"},
    "diabetes": {"en": "Diabetes Mellitus", "hi": "मधुमेह (डायबिटीज)"},
    "hypoglycemia": {"en": "Hypoglycemia (Low Blood Sugar)", "hi": "निम्न रक्त शर्करा (हाइपोग्लाइसीमिया)"},
    "hyperthyroidism": {"en": "Hyperthyroidism", "hi": "हाइपरथायरायडिज्म"},
    "hypothyroidism": {"en": "Hypothyroidism", "hi": "हाइपोथायरायडिज्म"},
    "arthritis": {"en": "Arthritis", "hi": "गठिया (अर्थराइटिस)"},
    "osteoarthristis": {"en": "Osteoarthritis", "hi": "ऑस्टियोआर्थराइटिस"},
    "cervical_spondylosis": {"en": "Cervical Spondylosis", "hi": "सर्वाइकल स्पोंडिलोसिस"},
    "varicose_veins": {"en": "Varicose Veins", "hi": "वेरिकोज नसें"},
    "(vertigo)_paroymsal__positional_vertigo": {"en": "Vertigo (BPPV)", "hi": "वर्टिगो (चक्कर आना)"},
    "paralysis_(brain_hemorrhage)": {"en": "Paralysis (Brain Hemorrhage)", "hi": "पक्षाघात (लकवा)"},
    "aids": {"en": "AIDS (HIV)", "hi": "एड्स (एचआईवी)"}
}

@router.get("/medicines/{disease_id}", response_model=MedicinesResponse)
async def get_medicines_for_disease(disease_id: str, language: str = "en"):
    """Get recommended medicines for a disease"""
    if disease_id not in MOCK_MEDICINES:
        raise HTTPException(status_code=404, detail="Disease not found")

    medicines_data = MOCK_MEDICINES[disease_id]
    disease_names = DISEASE_NAMES.get(disease_id, {"en": disease_id.replace("_", " ").title(), "hi": disease_id})

    medicines = [
        MedicineDetail(**med) for med in medicines_data
    ]

    return MedicinesResponse(
        disease_id=disease_id,
        disease_name=disease_names.get(language, disease_names["en"]),
        medicines=medicines,
        language=language
    )

@router.get("/medicines")
async def get_all_medicines(language: str = "en"):
    """Get list of all available medicines"""
    all_medicines = []
    for medicines_list in MOCK_MEDICINES.values():
        all_medicines.extend(medicines_list)

    # Remove duplicates by id
    seen = set()
    unique_medicines = []
    for med in all_medicines:
        if med["id"] not in seen:
            unique_medicines.append(med)
            seen.add(med["id"])

    return {"medicines": unique_medicines, "total": len(unique_medicines)}
