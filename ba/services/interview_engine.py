from concurrent.futures import ThreadPoolExecutor
from services.audio_processor import process_audio
from services.whisper_service import transcribe_audio
from services.llm_evaluator import evaluate_interview
import json
from typing import Optional, List, Dict, Any

def process_interview(
    items: List[Dict[str, Any]],
    interview_type: str = "common",
    role: Optional[str] = None,
):
    results: List[Dict[str, Any]] = []

    def process_audio_only(item):
        try:
            clean_path, metrics = process_audio(item["filePath"])

            return {
                "question": item["question"],
                "cleanPath": clean_path,
                "metrics": metrics or {},
            }
        except Exception as e:
            print("Audio processing failed:", e)
            return {
                "question": item["question"],
                "cleanPath": None,
                "metrics": {},
            }

    with ThreadPoolExecutor(max_workers=4) as executor:
        audio_results = list(executor.map(process_audio_only, items))

    for item in audio_results:
        try:
            transcript = ""

            if item["cleanPath"]:
                transcript = transcribe_audio(item["cleanPath"]) or ""

            transcript = str(transcript).strip()

            if not transcript:
                transcript = "Candidate gave a very short or unclear response."

            print("Transcript:", transcript)

            results.append({
                "question": item["question"],
                "transcript": transcript,
                "metrics": item["metrics"],
            })

        except Exception as e:
            print("Transcription failed:", e)

            results.append({
                "question": item["question"],
                "transcript": "Transcription failed.",
                "metrics": item["metrics"],
            })

    try:
        evaluation = evaluate_interview(
            results,
            interview_type=interview_type,
            role=role,
        )
    except Exception as e:
        print("Evaluation failed:", e)
        evaluation = {
            "questions": [],
            "overallEvaluation": {},
        }

    final_report = json.dumps(evaluation)

    return final_report