from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Medicine Recommendation System",
    description="AI-powered medicine recommendation for Indian users",
    version="0.1.0"
)

# CORS middleware for frontend
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services on startup
@app.on_event("startup")
async def startup_event():
    """Initialize services when app starts"""
    # Initialize MongoDB
    try:
        from app.database import connect_to_mongo
        await connect_to_mongo()
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        # Don't raise - allow app to start even if MongoDB is not connected

    # Initialize STT service
    try:
        from app.services.stt_service import init_stt_service
        stt_provider = os.getenv("STT_PROVIDER", "whisper")
        logger.info(f"Initializing STT provider: {stt_provider}")
        init_stt_service(stt_provider)
        logger.info("STT service initialized successfully")
    except Exception as e:
        logger.warning(f"STT service initialization failed: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        from app.database import close_mongo_connection
        await close_mongo_connection()
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Import routes
from app.routes import diagnosis, medicines, interactions, prescriptions, transcription, auth, medical_history

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(medical_history.router, prefix="/api", tags=["Medical History"])
app.include_router(diagnosis.router, prefix="/api", tags=["Diagnosis"])
app.include_router(medicines.router, prefix="/api", tags=["Medicines"])
app.include_router(interactions.router, prefix="/api", tags=["Interactions"])
app.include_router(prescriptions.router, prefix="/api", tags=["Prescriptions"])
app.include_router(transcription.router, prefix="/api", tags=["Transcription"])

@app.get("/")
async def root():
    return {
        "message": "Medicine Recommendation System API",
        "version": "0.1.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

