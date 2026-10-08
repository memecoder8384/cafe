"""
Sarvam AI Text-to-Speech (TTS) Service.
Handles natural speech generation for the Café Assistant using Sarvam AI Bulbul models.
"""
import base64
import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("cafe_backend.sarvam_tts")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_MODEL = os.getenv("SARVAM_MODEL", "bulbul:v3")
SARVAM_SPEAKER = (os.getenv("SARVAM_SPEAKER", "simran") or "simran").strip().lower()
SARVAM_LANGUAGE_CODE = os.getenv("SARVAM_LANGUAGE_CODE", "en-IN")
SARVAM_PACE = float(os.getenv("SARVAM_PACE", "1.0"))

# Initialize SarvamAI SDK client if available
_sarvam_client = None
try:
    if SARVAM_API_KEY:
        from sarvamai import SarvamAI
        _sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)
        logger.info(f"Initialized SarvamAI SDK client (Model: {SARVAM_MODEL}, Speaker: {SARVAM_SPEAKER})")
    else:
        logger.warning("SARVAM_API_KEY is not set. Sarvam TTS will not be available.")
except Exception as e:
    logger.warning(f"Could not initialize SarvamAI SDK client: {e}. Will fallback to direct HTTP.")


def is_sarvam_configured() -> bool:
    """Check if Sarvam API key is configured."""
    return bool(os.getenv("SARVAM_API_KEY") or SARVAM_API_KEY)


def generate_speech(
    text: str,
    language_code: Optional[str] = None,
    speaker: Optional[str] = None,
    model: Optional[str] = None,
    pace: Optional[float] = None
) -> bytes:
    """
    Generate natural spoken audio (WAV format) from text using Sarvam AI TTS.
    
    Args:
        text: Text to synthesize.
        language_code: Language code (default 'en-IN').
        speaker: Voice persona (default 'kavya').
        model: TTS model (default 'bulbul:v3').
        pace: Speech speed 0.5 - 2.0 (default 1.0).
        
    Returns:
        bytes: Raw WAV audio bytes.
        
    Raises:
        ValueError: If text is invalid or API key missing.
        RuntimeError: If Sarvam API fails.
    """
    cleaned_text = (text or "").strip()
    if not cleaned_text:
        raise ValueError("Text cannot be empty for TTS synthesis.")

    # Limit text to 1000 characters for snappy latency and safety
    if len(cleaned_text) > 1000:
        cleaned_text = cleaned_text[:1000].rsplit(" ", 1)[0] + "."

    api_key = os.getenv("SARVAM_API_KEY") or SARVAM_API_KEY
    if not api_key:
        raise ValueError("SARVAM_API_KEY is not configured on the backend.")

    lang = language_code or os.getenv("SARVAM_LANGUAGE_CODE", SARVAM_LANGUAGE_CODE)
    spk = (speaker or os.getenv("SARVAM_SPEAKER", SARVAM_SPEAKER) or "simran").strip().lower()
    mdl = model or os.getenv("SARVAM_MODEL", SARVAM_MODEL)
    speed = pace if pace is not None else SARVAM_PACE

    # Attempt 1: Official SarvamAI SDK
    global _sarvam_client
    if _sarvam_client is None and api_key:
        try:
            from sarvamai import SarvamAI
            _sarvam_client = SarvamAI(api_subscription_key=api_key)
        except Exception:
            _sarvam_client = None

    if _sarvam_client is not None:
        try:
            response = _sarvam_client.text_to_speech.convert(
                text=cleaned_text,
                language_code=lang,
                speaker=spk,
                model=mdl,
                pace=speed,
                output_audio_codec="wav"
            )
            if response and response.audios and len(response.audios) > 0:
                audio_bytes = base64.b64decode(response.audios[0])
                if audio_bytes:
                    return audio_bytes
        except Exception as sdk_err:
            logger.warning(f"Sarvam SDK call failed: {sdk_err}. Trying direct REST call...")

    # Attempt 2: Direct REST call (via httpx)
    import httpx
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": [cleaned_text],
        "target_language_code": lang,
        "speaker": spk,
        "model": mdl,
        "pace": speed
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(f"Sarvam REST API error {resp.status_code}: {resp.text}")
                raise RuntimeError(f"Sarvam API responded with status {resp.status_code}: {resp.text}")

            data = resp.json()
            audios = data.get("audios", [])
            if not audios:
                raise RuntimeError("Sarvam API returned empty audio array.")

            audio_bytes = base64.b64decode(audios[0])
            return audio_bytes
    except Exception as http_err:
        logger.error(f"Sarvam REST TTS generation failed: {http_err}")
        raise RuntimeError(f"Sarvam TTS generation failed: {http_err}") from http_err
