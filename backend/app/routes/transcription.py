from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import tempfile
import os
from pathlib import Path
from app.services.stt_service import get_stt_service
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@dataclass
class TranscriptionResponse:
    text: str
    language: str
    confidence: float
    provider: str
    segments: int

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Transcribe audio file to text using Whisper

    Args:
        audio: Audio file (mp3, wav, m4a, ogg, flac, webm)
        language: Language code ("en", "hi", "mr")

    Returns:
        Transcription result with confidence score
    """
    temp_audio_path = None
    try:
        if not audio.filename:
            raise HTTPException(status_code=400, detail="No audio file provided")

        # Validate language
        supported_languages = ["en", "hi", "mr"]
        if language not in supported_languages:
            raise HTTPException(
                status_code=400,
                detail=f"Language not supported. Use: {', '.join(supported_languages)}"
            )

        logger.info(f"Transcribing audio: {audio.filename}, language: {language}")

        # Save uploaded file to temp directory
        temp_dir = tempfile.gettempdir()
        temp_audio_path = os.path.join(temp_dir, f"temp_{audio.filename}")

        # Save uploaded file
        content = await audio.read()
        with open(temp_audio_path, "wb") as f:
            f.write(content)

        logger.info(f"Saved temp audio to: {temp_audio_path}")

        # Get STT service and transcribe
        stt_service = get_stt_service()
        logger.info(f"Using STT service: {stt_service.__class__.__name__}")

        result = stt_service.transcribe(temp_audio_path, language)
        logger.info(f"Transcription result: {result}")

        return TranscriptionResponse(**result)

    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Audio file error: {str(e)}")
    except RuntimeError as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
                logger.info(f"Cleaned up temp file: {temp_audio_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {str(e)}")
