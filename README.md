# 💊 Medicine Recommendation System

An Indian-friendly medicine recommendation system built with React + Python FastAPI. Supports symptom-based diagnosis, drug interaction checking, and personalized prescriptions with wellness tips in English & Hindi.

## Features

✅ **Symptom Selection** — Click checkboxes or type symptoms  
✅ **AI Diagnosis** — Get disease prediction with confidence score  
✅ **Prescriptions** — Complete medicine recommendations with dosage & duration  
✅ **Drug Interactions** — Safety checking for medicine combinations  
✅ **Wellness Tips** — Yoga, meditation, hydration, bed rest advice  
✅ **Bilingual** — English + हिंदी support  
✅ **Accessible** — Simple UI for users with limited medical literacy  

## Tech Stack

- **Frontend**: React 18 + Vite + i18next (multilingual)
- **Backend**: Python FastAPI
- **Database**: SQLite
- **Styling**: Custom CSS utilities (no external framework)

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.9+

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Run the backend:
```bash
uvicorn app.main:app --reload --host localhost --port 8000
```

✅ Backend runs on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend runs on `http://localhost:5173`

### 3. Open in Browser

Visit: **http://localhost:5173**

## How to Use

1. **Select Symptoms**
   - Type symptoms in the text field: `"fever and cough"` or `"बुखार, खांसी"`
   - Symptoms auto-select as you type
   - Or click checkboxes manually

2. **Get Diagnosis**
   - Click "Get Diagnosis" button
   - See predicted disease with confidence %

3. **Generate Prescription**
   - Click "Generate Prescription"
   - View medicines with dosage, frequency, duration
   - See wellness tips tailored to the disease

4. **Switch Languages**
   - Click "English" or "हिंदी" button in top-right
   - All text switches instantly

## Supported Symptoms

| English | हिंदी |
|---------|--------|
| Fever | बुखार |
| Cough | खांसी |
| Sore Throat | गले में खराश |
| Body Ache | शरीर में दर्द |
| Runny Nose | बहती नाक |
| Headache | सिरदर्द |
| Fatigue | थकान |
| Sneezing | छींक |

## API Endpoints

### Diagnosis
```bash
POST /api/diagnose
{
  "symptoms": ["fever", "cough"],
  "language": "en"
}
```

Response:
```json
{
  "disease_id": 1,
  "disease_name": "Fever",
  "confidence": 1.0,
  "severity": "moderate",
  "recommendations": "Elevated body temperature"
}
```

### Medicines
```bash
GET /api/medicines/1?language=en
```

### Drug Interactions
```bash
POST /api/check-interactions
{
  "medicine_ids": ["paracetamol", "cetirizine"]
}
```

### Generate Prescription
```bash
POST /api/generate-prescription
{
  "disease_id": 1,
  "disease_name": "Fever",
  "medicines": ["paracetamol", "cetirizine"],
  "language": "en"
}
```

## File Structure

```
medicine_recommendation/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── routes/
│   │   │   ├── diagnosis.py     # Disease prediction
│   │   │   ├── medicines.py     # Medicine recommendations
│   │   │   ├── interactions.py  # Drug interactions
│   │   │   └── prescriptions.py # Prescription generation
│   │   └── models/
│   │       └── disease_database.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main component
│   │   ├── api.js               # API client
│   │   ├── voiceService.js      # Voice/text parsing
│   │   ├── i18n.js              # Translations
│   │   └── App.css              # Styling
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Customization

### Add More Diseases
Edit `backend/app/routes/diagnosis.py` — add to `DISEASE_DATABASE`

### Add More Medicines
Edit `backend/app/routes/medicines.py` — add to `MEDICINES_DATABASE`

### Customize Wellness Tips
Edit `backend/app/routes/prescriptions.py` — modify `WELLNESS_TIPS`

### Add Languages
1. Add translations to `frontend/src/i18n.js`
2. Update i18next config with new language code

## Troubleshooting

**Q: "Failed to connect to backend"**  
A: Make sure backend is running on `http://localhost:8000`. Check terminal for errors.

**Q: Text input not detecting symptoms**  
A: Symptom names are case-insensitive. Try: `fever`, `Fever`, `FEVER` — all work. For Hindi, use Devanagari script: `बुखार`.

**Q: Prescription not generating**  
A: Backend must be running. Check browser console (F12) for API errors.

## Future Enhancements

- [ ] Real ML models for diagnosis (scikit-learn, TensorFlow)
- [ ] Actual medicine database (DrugBank, Indian Pharmacopoeia)
- [ ] Voice input (Hugging Face Whisper with internet)
- [ ] User accounts & prescription history
- [ ] Doctor review workflow
- [ ] Mobile app (React Native)
- [ ] Real drug interaction database
- [ ] Side effects & contraindications checker

## License

MIT

## Support

For issues or questions, check the GitHub issues or open a new one.

---

**Built with ❤️ for Indian healthcare accessibility**
