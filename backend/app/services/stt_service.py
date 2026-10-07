import whisper
import os
from abc import ABC, abstractmethod
from pathlib import Path
import tempfile

class STTProvider(ABC):
    """Base class for Speech-to-Text providers"""

    @abstractmethod
    def transcribe(self, audio_path: str, language: str = "en") -> dict:
        """Transcribe audio file to text"""
        pass

class WhisperSTT(STTProvider):
    """OpenAI Whisper-based STT (local, open-source)"""

    SUPPORTED_LANGUAGES = {
        "en": "english",
        "hi": "hindi",
        "mr": "marathi"
    }

    def __init__(self, model_size: str = None):
        """
        Initialize Whisper model (lazy loading to save memory)

        Args:
            model_size: "tiny", "base", "small" (defaults to WHISPER_MODEL env var or "tiny")
        """
        self.model_size = model_size or os.getenv("WHISPER_MODEL", "tiny")
        self.model = None

    def _load_model(self):
        if self.model is None:
            import whisper
            print(f"Loading Whisper model ({self.model_size})...")
            self.model = whisper.load_model(self.model_size)
            print("Whisper model loaded successfully")
        return self.model

    def transcribe(self, audio_path: str, language: str = "en") -> dict:
        """
        Transcribe audio file using Whisper

        Args:
            audio_path: Path to audio file (mp3, wav, m4a, etc.)
            language: Language code ("en", "hi", "mr")

        Returns:
            {
                "text": "transcribed text",
                "language": "detected language",
                "confidence": float,
                "provider": "whisper"
            }
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Map language code to Whisper language name
        whisper_lang = self.SUPPORTED_LANGUAGES.get(language, "english")

        try:
            model = self._load_model()
            # Transcribe with language hint
            result = model.transcribe(
                audio_path,
                language=whisper_lang,
                fp16=False,  # Use CPU-friendly float32
                verbose=False
            )

            return {
                "text": result["text"].strip(),
                "language": language,
                "confidence": result.get("confidence", 0.9),
                "provider": "whisper",
                "segments": len(result.get("segments", []))
            }
        except Exception as e:
            raise RuntimeError(f"Whisper transcription failed: {str(e)}")

class GoogleCloudSTT(STTProvider):
    """Google Cloud Speech-to-Text (optional production fallback)"""

    def __init__(self, api_key: str = None):
        """
        Initialize Google Cloud STT

        Args:
            api_key: Google Cloud API key (from GOOGLE_CLOUD_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GOOGLE_CLOUD_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_CLOUD_API_KEY environment variable not set")
        print("Google Cloud STT initialized (not yet implemented)")

    def transcribe(self, audio_path: str, language: str = "en") -> dict:
        """Transcribe using Google Cloud API"""
        # TODO: Implement Google Cloud Speech-to-Text API
        # This is a placeholder for future integration
        raise NotImplementedError("Google Cloud STT integration coming soon")

# Global STT service instance
_stt_service = None

def init_stt_service(provider: str = "whisper", **kwargs) -> STTProvider:
    """
    Initialize STT service

    Args:
        provider: "whisper" or "google_cloud"
        **kwargs: Provider-specific arguments

    Returns:
        STT provider instance
    """
    global _stt_service

    if provider == "whisper":
        _stt_service = WhisperSTT(**kwargs)
    elif provider == "google_cloud":
        _stt_service = GoogleCloudSTT(**kwargs)
    else:
        raise ValueError(f"Unknown STT provider: {provider}")

    return _stt_service

def get_stt_service() -> STTProvider:
    """Get current STT service instance"""
    global _stt_service
    if _stt_service is None:
        _stt_service = init_stt_service("whisper", model_size="base")
    return _stt_service

def transcribe_audio(audio_path: str, language: str = "en") -> dict:
    """Convenience function to transcribe audio"""
    service = get_stt_service()
    return service.transcribe(audio_path, language)
