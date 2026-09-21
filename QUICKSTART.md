# Quick Start Guide

## 🚀 Getting the App Running in 5 Minutes

### Terminal 1: Start Backend

```bash
cd backend
chmod +x run.sh
./run.sh
```

Or manually:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ Backend ready at: `http://localhost:8000/docs`

---

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
```

✅ Frontend ready at: `http://localhost:5173`

---

## 📋 Testing the Full Flow

1. **Open** `http://localhost:5173` in your browser
2. **Select Language** - Choose English or हिंदी
3. **Pick Symptoms** - Select "Fever" and "Cough"
4. **Get Diagnosis** - Click "Get Diagnosis"
5. **Review Results** - See predicted disease and confidence
6. **Generate Prescription** - Click "Generate Prescription"
7. **View Prescription** - See medicines, dosage, and wellness tips

## 🔍 API Testing

**Open** `http://localhost:8000/docs` to test API endpoints directly:

```bash
# Example: Diagnose from symptoms
POST /api/diagnose
{
  "symptoms": ["fever", "cough"],
  "language": "en"
}

# Example: Get medicines for disease
GET /api/medicines/cold?language=en

# Example: Check drug interactions
POST /api/check-interactions
{
  "medicine_ids": ["paracetamol", "ibuprofen"]
}

# Example: Generate prescription
POST /api/generate-prescription
{
  "disease_id": "cold",
  "disease_name": "Common Cold",
  "medicines": ["paracetamol", "cetirizine"],
  "language": "en"
}
```

## 📁 Project Structure

```
medicine-recommendation/
├── frontend/              # React app (http://localhost:5173)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # API client
│   │   ├── config/        # i18n translations
│   │   └── App.tsx        # Main component
│   └── .env              # Frontend config
├── backend/              # FastAPI app (http://localhost:8000)
│   ├── app/
│   │   ├── main.py       # Entry point
│   │   ├── routes/       # API endpoints
│   │   └── models/       # Database
│   └── run.sh            # Quick start script
└── README.md
```

## 🛠️ Troubleshooting

### Port 8000 already in use
```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9
# Or use different port:
python -m uvicorn app.main:app --reload --port 8001
```

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### CORS errors
- Make sure both servers are running
- Check `.env` files for correct API URLs
- Frontend should point to `http://localhost:8000/api`

### Module not found errors
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

### Python version issues
- Use Python 3.9 or higher
- Check: `python --version`

## 📊 Example Workflows

### Workflow 1: Common Cold
1. Select: Cough, Runny Nose, Sore Throat
2. Diagnosis: "Common Cold" (85% confidence)
3. Medicines: Paracetamol, Cetirizine
4. Tips: Steam inhalation, hydration, rest

### Workflow 2: Fever & Headache
1. Select: Fever, Headache, Body Ache
2. Diagnosis: "Influenza" (75% confidence)
3. Medicines: Oseltamivir, Paracetamol
4. Tips: Complete rest, hydration, meditation

### Workflow 3: Simple Cough
1. Select: Cough
2. Diagnosis: "Cough" (60% confidence)
3. Medicines: Cough Syrup
4. Tips: Honey & ginger, steam inhalation

## 🌐 Languages

**Current:**
- English (en)
- हिंदी Hindi (hi)

**Toggle in UI:** Click language buttons in header

## 📱 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Responsive design

## 🔐 Security Notes

- ⚠️ **This is MVP** - Not for production use
- No data is persisted in current version
- Always consult a real doctor
- Don't share medical information publicly

## 📚 Next Steps

After getting it running:

1. **Explore the API** - Visit `http://localhost:8000/docs`
2. **Try different symptom combinations**
3. **Check drug interactions**
4. **Review prescriptions in both languages**
5. **Check the code** in `frontend/src/` and `backend/app/`

## 💡 Tips

- Start with simple 1-2 symptom combinations
- Test both English and Hindi modes
- Try the drug interaction checker with multiple medicines
- Copy prescriptions to see full details
- Check console logs for debugging info

## ⚠️ Important Disclaimer

This is an **AI demonstration system**. It is **NOT** a substitute for professional medical advice. Always consult a qualified doctor before taking any medication.

---

**Happy testing! 🎉**

Need help? Check the main README.md for more details.
