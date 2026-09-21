import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Optional

DB_PATH = Path(__file__).parent / "data" / "medicines.db"

class MedicineDatabase:
    def __init__(self, db_path: str = str(DB_PATH)):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Diseases table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS diseases (
                id TEXT PRIMARY KEY,
                name_en TEXT,
                name_hi TEXT,
                description TEXT,
                severity TEXT
            )
        ''')

        # Medicines table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS medicines (
                id TEXT PRIMARY KEY,
                name_en TEXT,
                name_hi TEXT,
                generic_name TEXT,
                dosage_forms TEXT,
                strength TEXT,
                indication TEXT
            )
        ''')

        # Disease-Medicine mapping
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS disease_medicines (
                disease_id TEXT,
                medicine_id TEXT,
                recommended_dosage TEXT,
                duration_days INTEGER,
                frequency TEXT,
                meal_instruction TEXT,
                PRIMARY KEY (disease_id, medicine_id),
                FOREIGN KEY (disease_id) REFERENCES diseases(id),
                FOREIGN KEY (medicine_id) REFERENCES medicines(id)
            )
        ''')

        # Drug interactions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS drug_interactions (
                medicine1_id TEXT,
                medicine2_id TEXT,
                severity TEXT,
                description TEXT,
                PRIMARY KEY (medicine1_id, medicine2_id),
                FOREIGN KEY (medicine1_id) REFERENCES medicines(id),
                FOREIGN KEY (medicine2_id) REFERENCES medicines(id)
            )
        ''')

        # Side effects
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS side_effects (
                id INTEGER PRIMARY KEY,
                medicine_id TEXT,
                side_effect_en TEXT,
                side_effect_hi TEXT,
                severity TEXT,
                frequency TEXT,
                FOREIGN KEY (medicine_id) REFERENCES medicines(id)
            )
        ''')

        conn.commit()
        conn.close()

    def add_disease(self, disease_id: str, name_en: str, name_hi: str, description: str, severity: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO diseases (id, name_en, name_hi, description, severity)
            VALUES (?, ?, ?, ?, ?)
        ''', (disease_id, name_en, name_hi, description, severity))
        conn.commit()
        conn.close()

    def add_medicine(self, med_id: str, name_en: str, name_hi: str, generic_name: str,
                    dosage_forms: str, strength: str, indication: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO medicines (id, name_en, name_hi, generic_name, dosage_forms, strength, indication)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (med_id, name_en, name_hi, generic_name, dosage_forms, strength, indication))
        conn.commit()
        conn.close()

    def add_disease_medicine(self, disease_id: str, medicine_id: str, dosage: str,
                            duration: int, frequency: str, meal_instruction: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO disease_medicines (disease_id, medicine_id, recommended_dosage, duration_days, frequency, meal_instruction)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (disease_id, medicine_id, dosage, duration, frequency, meal_instruction))
        conn.commit()
        conn.close()

    def get_medicines_for_disease(self, disease_id: str) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT m.id, m.name_en, m.name_hi, m.generic_name, dm.recommended_dosage,
                   dm.duration_days, dm.frequency, dm.meal_instruction
            FROM medicines m
            JOIN disease_medicines dm ON m.id = dm.medicine_id
            WHERE dm.disease_id = ?
        ''', (disease_id,))

        columns = [description[0] for description in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return results

    def check_drug_interaction(self, medicine1_id: str, medicine2_id: str) -> Optional[Dict]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT severity, description FROM drug_interactions
            WHERE (medicine1_id = ? AND medicine2_id = ?)
               OR (medicine1_id = ? AND medicine2_id = ?)
        ''', (medicine1_id, medicine2_id, medicine2_id, medicine1_id))

        result = cursor.fetchone()
        conn.close()

        if result:
            return {"severity": result[0], "description": result[1]}
        return None

    def get_side_effects(self, medicine_id: str) -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT side_effect_en, side_effect_hi, severity, frequency
            FROM side_effects
            WHERE medicine_id = ?
        ''', (medicine_id,))

        results = [{"en": row[0], "hi": row[1], "severity": row[2], "frequency": row[3]}
                  for row in cursor.fetchall()]
        conn.close()
        return results

# Initialize global database instance
db = MedicineDatabase()
