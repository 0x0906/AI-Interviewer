import whisper
import torch
from threading import Lock

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_whisper_model = None
_model_lock = Lock()


def load_whisper():
    global _whisper_model

    if _whisper_model is not None:
        return

    with _model_lock:
        if _whisper_model is None:
            print("[Whisper] Loading model...")
            _whisper_model = whisper.load_model("large", device=DEVICE)
            print("[Whisper] Model loaded")


def transcribe_audio(file_path: str) -> str:
    global _whisper_model

    if _whisper_model is None:
        raise RuntimeError("Whisper not loaded. Call load_whisper() at startup.")

    try:
        result = _whisper_model.transcribe(
            file_path,
            task="transcribe",
            language="en",
            fp16=(DEVICE == "cuda"),
        )
        return result["text"].strip()

    except Exception as e:
        print("[Whisper fallback fp32]", e)

        result = _whisper_model.transcribe(
            file_path,
            task="transcribe",
            language="en",
            fp16=False,
        )
        return result["text"].strip()