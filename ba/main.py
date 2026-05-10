from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List
import os
import json
import shutil
import random
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import librosa
from services.interview_engine import process_interview
import numpy as np
from services.questions_service import generate_questions_service
from services.whisper_service import load_whisper
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

# py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_whisper() 

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class QuestionRequest(BaseModel):
    type: str
    role: Optional[str] = None
    count: int = Field(gt=0, le=20)
    difficulty: Optional[str] = None
    session_id: Optional[str] = None

@app.post("/questions")
def generate_questions(req: QuestionRequest):
    if req.type == "role":
        if not req.role:
            raise HTTPException(
                status_code=400,
                detail="Role is required for role-based interview",
            )
        if not req.difficulty:
            raise HTTPException(
                status_code=400,
                detail="Difficulty is required for role-based interview",
            )

        questions = generate_questions_service(
            role=req.role,
            count=req.count,
            difficulty=req.difficulty,
            session_id=req.session_id,
            interview_type="role",
        )

    else:
        questions = generate_questions_service(
            role="common",
            count=req.count,
            difficulty="medium",
            session_id=req.session_id,
            interview_type="common",
        )

    print(questions)

    return {
        "type": req.type,
        "role": req.role,
        "difficulty": req.difficulty,
        "session_id": req.session_id,
        "questions": questions,
    }


@app.post("/upload")
async def evaluate_interview(
    files: List[UploadFile] = File(...),
    questions: str = Form(...),
    interview_type: Optional[str] = Form("common"),
    role: Optional[str] = Form(None), 
):
    try:
        try:
            questions_list = json.loads(questions)
            if not isinstance(questions_list, list):
                raise ValueError()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid questions payload",
            )

        file_paths = []

        for file in files:
            ext = os.path.splitext(file.filename)[1]
            safe_name = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, safe_name)

            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())

            file_paths.append(file_path)

        if len(file_paths) != len(questions_list):
            raise HTTPException(
                status_code=400,
                detail="Number of files and questions do not match",
            )

        items = []

        for i in range(len(file_paths)):
            items.append({
                "filePath": file_paths[i],
                "question": questions_list[i],
            })

        report = process_interview(
            items,
            interview_type=interview_type,
            role=role,
        )

        return {
            "report": report,
            "interview_type": interview_type,
            "role": role,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Upload processing error:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to process interview",
        )