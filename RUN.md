# 🚀 How to Run the Medicine Recommendation System

## Quick Start (2 Terminals)

### Terminal 1: Start Backend

```bash
cd /Users/mayureshloke/Desktop/MyProjects/medicine_recommendation/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

✅ Backend ready at: `http://localhost:8000`
📖 API Docs at: `http://localhost:8000/docs`

---

### Terminal 2: Start Frontend

```bash
cd /Users/mayureshloke/Desktop/MyProjects/medicine_recommendation/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

✅ Frontend ready at: `http://localhost:5173`

---

## 3. Open in Browser

Visit: **http://localhost:5173**

---

## 🧪 Test It Out

1. **Select symptoms** (e.g., "Fever" + "Cough")
2. **Click "Get Diagnosis"** → Should see disease prediction
3. **Click "Generate Prescription"** → Should see medicines & tips
4. **Switch to हिंदी** (Hindi) → Test bilingual support
5. **Copy prescription** → Try copying to clipboard

---

## 📋 Simpler One-Liner (If needed)

**Start just the backend:**
```bash
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload --port 8000
```

**Start just the frontend:**
```bash
cd frontend && npm run dev
```

---

## ✅ Verification

### Check Backend Health
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"healthy"}`

### Check API Docs
Open in browser:
```
http://localhost:8000/docs
```

---

## 🎯 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Run `source venv/bin/activate` first |
| Port 8000 in use | `lsof -ti:8000 \| xargs kill -9` |
| Port 5173 in use | `npm run dev -- --port 3000` |
| `npm: command not found` | Install Node.js from nodejs.org |
| No module named uvicorn | Run `pip install -r requirements.txt` |

---

**That's it! Your app is running!** 🎉
