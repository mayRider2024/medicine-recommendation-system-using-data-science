#!/bin/bash

# Medicine Recommendation System - Backend Run Script

echo "🏥 Medicine Recommendation System - Backend"
echo "==========================================="
echo ""

# Remove old venv if it exists
if [ -d "venv" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf venv
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run the server
echo ""
echo "🚀 Starting FastAPI server..."
echo "📍 API available at: http://localhost:8000"
echo "📖 API docs at: http://localhost:8000/docs"
echo ""
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
