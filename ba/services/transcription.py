import whisper
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

whisper_model = whisper.load_model("medium", device=DEVICE)

def transcribe_audio(file_path):
    try:
        result = whisper_model.transcribe(
            file_path,
            task="transcribe",
            language="en",
            fp16=(DEVICE == "cuda")
        )
        return result["text"].strip()

    except Exception as e:
        result = whisper_model.transcribe(
            file_path,
            task="transcribe",
            language="en",
            fp16=False
        )
        return result["text"].strip()
