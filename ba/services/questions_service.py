import json
import random
import re
from typing import List, Dict, Optional

import requests
from fastapi import HTTPException
from difflib import SequenceMatcher

OLLAMA_URL = "http://localhost:11434/api/generate"

INTERVIEW_MEMORY: Dict[str, List[str]] = {}

HARDCODED_INTRO = "Tell me about yourself."

COMMON_QUESTION_BANK: List[str] = [
    "Tell me about yourself.",
    "Why do you want to work here?",
    "What are your greatest strengths?",
    "What is your biggest weakness?",
    "Describe a challenging situation you faced at work.",
    "Why are you leaving your current job?",
    "Where do you see yourself in five years?",
    "Tell me about a time you worked in a team.",
    "How do you handle stress and pressure?",
    "Describe a time you showed leadership.",
    "Tell me about a failure and what you learned.",
    "How do you prioritize your work?",
    "What motivates you?",
    "Why should we hire you?",
    "Do you have any questions for us?",
    "Walk me through your resume.",
    "Tell me about a time you handled conflict at work.",
    "Describe a time you went above and beyond.",
    "Tell me about a time you had to meet a tight deadline.",
    "Describe a time you took initiative.",
]

def get_session_history(session_id: str) -> List[str]:
    return INTERVIEW_MEMORY.get(session_id, [])


def save_session_questions(session_id: str, questions: List[str]) -> None:
    if session_id not in INTERVIEW_MEMORY:
        INTERVIEW_MEMORY[session_id] = []

    INTERVIEW_MEMORY[session_id].extend(questions)
    INTERVIEW_MEMORY[session_id] = INTERVIEW_MEMORY[session_id][-60:]


def is_similar(a: str, b: str, threshold: float = 0.78) -> bool:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio() >= threshold


def remove_near_duplicates(
    questions: List[str],
    previous: List[str],
) -> List[str]:
    result: List[str] = []

    for q in questions:
        dup = False

        for existing in result:
            if is_similar(q, existing):
                dup = True
                break

        if not dup:
            for old in previous:
                if is_similar(q, old):
                    dup = True
                    break

        if not dup:
            result.append(q)

    return result


def clean_question_text(q: str) -> str:
    q = q.strip()
    q = re.sub(r"^\d+[\).\-\s]+", "", q)
    q = re.sub(r"\s+", " ", q)

    if not q.endswith("?"):
        q = q.rstrip(".") + "?"

    return q


def build_question_prompt(
    role: str,
    count: int,
    difficulty: str,
    previous_questions: List[str],
) -> str:
    entropy_tag = random.randint(1000, 9999)

    history_block = (
        "\n".join(f"- {q}" for q in previous_questions[-15:])
        if previous_questions
        else "None"
    )

    return f"""
SESSION_ID: {entropy_tag}

You are a senior professional interviewer.

CRITICAL:
Role = "{role}"
Generate domain-specific questions only for this role.
Do NOT default to software questions unless role is software.

INTERVIEW CONTEXT:
Role: {role}
Difficulty: {difficulty}
Questions needed: {count}

INTERVIEW MEMORY (DO NOT REPEAT):
{history_block}

Return EXACTLY {count} questions in JSON.

FORMAT:
{{
  "questions": ["..."]
}}
"""

def call_ollama(prompt: str) -> str:
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "qwen2.5:7b-instruct-q4_K_M",
            "prompt": prompt,
            "stream": False,
            "temperature": 0.2,
            "top_p": 0.7,
            "repeat_penalty": 1.0,
            "num_predict": 180,
            "keep_alive": "30m",
            "format": "json",
            "think": False,
            "num_ctx": 1024
        },
        timeout=120,
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="LLM request failed")

    return response.json().get("response", "")

def safe_parse_questions(
    llm_text: str,
    previous_questions: List[str],
) -> List[str]:
    try:
        if not llm_text:
            return []

        text = llm_text.strip()

        if text.startswith("```"):
            parts = text.split("```")
            if len(parts) >= 2:
                text = parts[1]

        parsed = json.loads(text)
        questions = parsed.get("questions", [])

        cleaned = [
            clean_question_text(q)
            for q in questions
            if isinstance(q, str) and q.strip()
        ]

        cleaned = remove_near_duplicates(cleaned, previous_questions)
        return cleaned

    except Exception:
        return []

def generate_questions_service(
    role: str,
    count: int,
    difficulty: str,
    session_id: Optional[str] = None,
    interview_type: str = "role",
) -> List[str]:

    print(f"[QUESTION_SERVICE] type={interview_type}, count={count}")
    if interview_type != "role":
        pool = COMMON_QUESTION_BANK.copy()
        random.shuffle(pool)

        if count == 1:
            return [pool[0]]

        questions = [HARDCODED_INTRO]

        for q in pool:
            if q.lower() == HARDCODED_INTRO.lower():
                continue
            questions.append(q)
            if len(questions) == count:
                break

        return questions[:count]

    if not session_id:
        session_id = f"session_{random.randint(100000, 999999)}"

    previous_questions = get_session_history(session_id)
    questions: List[str] = []

    if count > 1 and not any(
        "tell me about yourself" in q.lower() for q in previous_questions
    ):
        questions.append(HARDCODED_INTRO)

    remaining = count - len(questions)

    attempts = 0
    MAX_ATTEMPTS = 4

    while remaining > 0 and attempts < MAX_ATTEMPTS:
        attempts += 1

        prompt = build_question_prompt(
            role=role,
            count=remaining,
            difficulty=difficulty,
            previous_questions=previous_questions + questions,
        )

        llm_response = call_ollama(prompt)

        new_questions = safe_parse_questions(
            llm_response,
            previous_questions + questions,
        )

        questions.extend(new_questions)
        remaining = count - len(questions)

    if len(questions) < count:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate enough UNIQUE role-specific questions.",
        )

    save_session_questions(session_id, questions)

    return questions[:count]