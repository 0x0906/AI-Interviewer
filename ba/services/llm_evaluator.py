import requests
import json
from typing import List, Dict, Any, Optional

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:7b-instruct-q4_K_M"
MAX_QUESTIONS = 5
REQUEST_TIMEOUT = 120

def _empty_result(reason: str = "Evaluation failed") -> Dict[str, Any]:
    return {
        "decisionSummary": {
            "hireRecommendation": "No Hire",
            "whyThisRecommendation": reason,
            "finalSummary": "No data available.",
            "biggestStrengths": ["None"],
            "biggestWeaknesses": ["Evaluation failed"],
            "priorityImprovements": ["None"]
        },
        "overallScores": {
            "overallCommunicationScore": 0,
            "overallConfidenceScore": 0,
            "overallTechnicalScore": 0,
            "overallRelevanceScore": 0
        },
        "questionBreakdown": [],
        "deepDiveFeedback": []
    }

def _build_prompt(results: List[Dict[str, Any]]) -> str:
    num_questions = len(results)
    prompt = f"""You are a STRICT technical interviewer evaluating a candidate.

CRITICAL GRADING RULES:
1. INAPPROPRIATE CONTENT: If any answer contains profanity, insults, or highly unprofessional language (e.g., "shut up", "fuck", "shit"), score ALL metrics for that question as 0. Set hireRecommendation to "No Hire" and clearly note the unprofessionalism.
2. LOW SIGNAL: If an answer is extremely short (under 12 words) or lacks substance, cap its scores at 3 out of 10.
3. DUPLICATES: If an answer is generic or an exact copy of a previous answer, score it 0.
4. NO INFLATION: Do not give scores above 6 unless the candidate provides specific, concrete evidence.
5. COMPLETENESS: There are exactly {num_questions} questions in the transcript below. You MUST evaluate ALL OF THEM. The `questionBreakdown` and `deepDiveFeedback` arrays MUST contain exactly {num_questions} objects each (one for each question).

Respond ONLY with valid JSON matching this exact structure (do not wrap it in any other keys):
{{
  "decisionSummary": {{
    "hireRecommendation": "Strong Hire | Hire | Borderline | No Hire",
    "whyThisRecommendation": "string",
    "finalSummary": "string",
    "biggestStrengths": ["string"],
    "biggestWeaknesses": ["string"],
    "priorityImprovements": ["string"]
  }},
  "overallScores": {{
    "overallCommunicationScore": 0, 
    "overallConfidenceScore": 0, 
    "overallTechnicalScore": 0, 
    "overallRelevanceScore": 0
  }},
  "questionBreakdown": [
    {{
      "questionIndex": 1, 
      "clarityScore": 0, 
      "technicalDepthScore": 0, 
      "confidenceScore": 0, 
      "answerQualityScore": 0, 
      "relevanceScore": 0, 
      "whatWentWell": ["string"], 
      "whatNeedsImprovement": ["string"]
    }}
  ],
  "deepDiveFeedback": [
    {{
      "questionIndex": 1,
      "interviewerPerspective": "string",
      "detailedFeedback": "string"
    }}
  ]
}}

INTERVIEW TRANSCRIPT:
"""
    for i, item in enumerate(results):
        question = item.get('question', '').strip()
        transcript = item.get('transcript', '').strip()
        prompt += f"\nQ{i+1}: {question}\nA{i+1}: {transcript}\n"
    
    return prompt

def _extract_and_parse_json(raw_text: str) -> Optional[Dict[str, Any]]:
    try:
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start == -1 or end == -1:
            return None
            
        clean_text = raw_text[start:end+1]
        data = json.loads(clean_text)
        
        if "report" in data and isinstance(data["report"], str):
            try:
                data = json.loads(data["report"])
            except json.JSONDecodeError:
                pass
                
        elif "report" in data and isinstance(data["report"], dict):
            data = data["report"]
            
        return data
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return None

def evaluate_interview(
    results: List[Dict[str, Any]],
    interview_type: str = "common",
    role: Optional[str] = None,
) -> Dict[str, Any]:
    
    if not results:
        return _empty_result("No transcript provided.")

    trimmed = results[:MAX_QUESTIONS]
    prompt = _build_prompt(trimmed)

    try:
        res = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL, 
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
            timeout=REQUEST_TIMEOUT
        )
        res.raise_for_status()
        raw_text = res.json().get("response", "")

        data = _extract_and_parse_json(raw_text)
        
        if not data or "decisionSummary" not in data or "questionBreakdown" not in data:
            return _empty_result("The AI returned an invalid evaluation format.")

        breakdown = data.get("questionBreakdown", [])
        if breakdown:
            num_q = len(breakdown)
            data["overallScores"] = {
                "overallCommunicationScore": int(sum(q.get("clarityScore", 0) for q in breakdown) / num_q),
                "overallTechnicalScore": int(sum(q.get("technicalDepthScore", 0) for q in breakdown) / num_q),
                "overallConfidenceScore": int(sum(q.get("confidenceScore", 0) for q in breakdown) / num_q),
                "overallRelevanceScore": int(sum(q.get("relevanceScore", 0) for q in breakdown) / num_q),
            }
            
        data.setdefault("deepDiveFeedback", [])
        data.setdefault("decisionSummary", {})
        
        return data

    except requests.exceptions.Timeout:
        return _empty_result("The evaluation timed out. Please try again.")
    except Exception as e:
        return _empty_result(f"System error: {str(e)}")