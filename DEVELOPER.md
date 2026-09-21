# Developer Quick Reference

## 🚀 Start Development

### Step 1: Backend
```bash
cd backend && ./run.sh
# or: python -m uvicorn app.main:app --reload --port 8000
```
✅ API: http://localhost:8000
📖 Docs: http://localhost:8000/docs

### Step 2: Frontend  
```bash
cd frontend && npm run dev
```
✅ App: http://localhost:5173

---

## 📁 Key Files

### Frontend
| File | Purpose |
|------|---------|
| `App.tsx` | Main app orchestrator |
| `components/SymptomChecker.tsx` | Symptom selection UI |
| `components/DiagnosisResult.tsx` | Diagnosis display |
| `components/PrescriptionView.tsx` | Prescription display |
| `services/apiClient.ts` | API integration |
| `config/i18n.ts` | Multilingual setup |
| `config/locales/*.json` | Translations |

### Backend
| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI entry point |
| `routes/diagnosis.py` | Diagnosis API |
| `routes/medicines.py` | Medicines API |
| `routes/interactions.py` | Drug interactions |
| `routes/prescriptions.py` | Prescription generator |
| `models/disease_database.py` | Database layer |

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/diagnose` | Get diagnosis |
| GET | `/api/symptoms` | List symptoms |
| GET | `/api/medicines/{id}` | Get medicines |
| GET | `/api/medicines` | All medicines |
| POST | `/api/check-interactions` | Check interactions |
| GET | `/api/interactions` | All interactions |
| POST | `/api/generate-prescription` | Generate Rx |
| GET | `/api/prescriptions` | Rx template |

---

## 🔄 Data Flow

```
User Input
    ↓
SymptomChecker (React)
    ↓
POST /api/diagnose
    ↓
DiagnosisResult (React)
    ↓
GET /api/medicines/{disease_id}
    ↓
POST /api/check-interactions
    ↓
POST /api/generate-prescription
    ↓
PrescriptionView (React)
    ↓
Copy/Download
```

---

## 🎨 UI Components

### SymptomChecker
```tsx
<SymptomChecker
  symptoms={symptoms}
  onSymptomsChange={setSymptoms}
  onDiagnose={handleDiagnose}
  isLoading={isLoading}
/>
```

### DiagnosisResult
```tsx
<DiagnosisResult
  diagnosis={diagnosis}
  onGeneratePrescription={handleGenerate}
/>
```

### PrescriptionView
```tsx
<PrescriptionView
  prescription={prescription}
  hasInteractions={hasInteractions}
/>
```

---

## 🌐 Languages

| Code | Language | Status |
|------|----------|--------|
| en | English | ✅ Active |
| hi | हिंदी | ✅ Active |

### Change Language
```tsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
i18n.changeLanguage('hi'); // Switch to Hindi
```

---

## 📊 Mock Data

### Diseases
```python
DISEASE_DATA = {
  'cold': {'name_en': 'Common Cold', 'name_hi': 'सर्दी', ...},
  'fever': {'name_en': 'Fever', 'name_hi': 'बुखार', ...},
  'cough': {'name_en': 'Cough', 'name_hi': 'खांसी', ...},
  'flu': {'name_en': 'Influenza', 'name_hi': 'फ्लू', ...},
  'headache': {'name_en': 'Headache', 'name_hi': 'सिरदर्द', ...},
}
```

### Medicines
```python
MOCK_MEDICINES = {
  'cold': [
    {
      'id': 'paracetamol',
      'name_en': 'Paracetamol',
      'name_hi': 'पैरासिटामोल',
      'dosage': '500mg',
      'frequency': '3 times daily',
      'duration_days': 3,
    },
    ...
  ]
}
```

---

## 🔧 Debugging

### Frontend
```bash
# Check browser console
# DevTools: F12 or Cmd+Option+I
# Network tab for API calls
# Console for errors
```

### Backend
```bash
# Check terminal output
# API docs: http://localhost:8000/docs
# Test endpoints directly
# Add print statements in code
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 8000 in use | `lsof -ti:8000 \| xargs kill -9` |
| Port 5173 in use | `npm run dev -- --port 3000` |
| Module not found | `npm install` or `pip install -r requirements.txt` |
| CORS error | Check `.env` files, ensure both servers running |

---

## 📦 Add New Feature

### Add New Disease
1. Add to `DISEASE_DATA` in `backend/routes/diagnosis.py`
2. Add medicines to `MOCK_MEDICINES`
3. Add interaction rules if needed

### Add New Medicine
1. Add to appropriate disease in `MOCK_MEDICINES`
2. Add side effects in `MEDICINE_DETAILS`
3. Add interactions if applicable

### Add New Language
1. Create `frontend/src/config/locales/[lang].json`
2. Add to i18n config in `frontend/src/config/i18n.ts`
3. Update language toggle in `App.tsx`

---

## 🧪 Testing Commands

```bash
# Frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests (when configured)

# Backend
python -m uvicorn app.main:app --reload
pytest tests/    # Run tests (when configured)
```

---

## 📝 Code Style

### Frontend (TypeScript/React)
```tsx
// Use functional components
export const MyComponent: React.FC<Props> = ({ prop }) => {
  const { t } = useTranslation(); // i18n
  return <div>{t('key')}</div>;
};
```

### Backend (Python/FastAPI)
```python
# Use type hints
@router.post("/endpoint")
async def endpoint(data: RequestModel) -> ResponseModel:
    return ResponseModel(...)
```

---

## 🚀 Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Test all endpoints
- [ ] Build frontend: `npm run build`
- [ ] Build backend Docker: `docker build -t app .`
- [ ] Test in production env
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up backups

---

## 📞 Quick Fixes

### Clear npm cache
```bash
npm cache clean --force
npm install
```

### Clear Python cache
```bash
find . -type d -name __pycache__ -exec rm -r {} +
```

### Reset to fresh state
```bash
rm -rf node_modules package-lock.json
npm install

rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🎯 Common Tasks

| Task | Command |
|------|---------|
| Start backend | `cd backend && ./run.sh` |
| Start frontend | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Test API | Open `http://localhost:8000/docs` |
| View logs | Check terminal output |
| Kill port 8000 | `lsof -ti:8000 \| xargs kill -9` |
| Format code | (add prettier when needed) |

---

## 📚 Resources

- React Docs: https://react.dev
- FastAPI Docs: https://fastapi.tiangolo.com
- i18next: https://www.i18next.com
- TypeScript: https://www.typescriptlang.org
- Vite: https://vitejs.dev

---

## 🎓 Learning Path

1. Start with `QUICKSTART.md`
2. Run the app
3. Explore `App.tsx` for main flow
4. Check `apiClient.ts` for API integration
5. Review `routes/` for backend logic
6. Try adding new symptoms/medicines
7. Test in both languages

---

## ✨ Pro Tips

- Use Swagger UI at `/docs` to test API
- Browser DevTools for frontend debugging
- Print statements in Python for backend debugging
- Use React DevTools Chrome extension
- Check network tab for API requests
- Use `i18n.changeLanguage()` to test translations

---

**Last Updated:** September 17, 2026
**Maintained by:** Medicine Recommendation Team
