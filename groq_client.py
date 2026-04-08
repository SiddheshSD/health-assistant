"""
Unified LLM client — supports two providers, switchable via .env:

  LLM_PROVIDER=groq    → Groq Cloud API (llama-3.3-70b-versatile) [default]
  LLM_PROVIDER=ollama  → Local Ollama (meditron:7b) — no API key needed

Ollama must be running locally: https://ollama.com
Pull the model once with: ollama pull meditron
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# ── Provider config ──────────────────────────────────────────────────────────
LLM_PROVIDER   = os.environ.get("LLM_PROVIDER", "groq").lower()
OLLAMA_HOST    = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL   = os.environ.get("OLLAMA_MODEL", "meditron")
GROQ_MODEL     = os.environ.get("GROQ_MODEL",  "llama-3.3-70b-versatile")

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not set. Add it to your .env file, "
                "or set LLM_PROVIDER=ollama to use local meditron."
            )
        _groq_client = Groq(api_key=api_key)
    return _groq_client


# ── Shared prompt builders ────────────────────────────────────────────────────

def _build_system_prompt() -> str:
    return """You are a compassionate and knowledgeable AI health assistant with expertise in clinical medicine.
You are given a preliminary disease prediction from a machine learning model,
real clinical information from a medical dataset, and the patient's reported symptoms.

Your role: provide clear, practical, empathetic health guidance.

RULES:
1. Use the provided clinical description and precautions as your knowledge base — expand on them.
2. Structure your response in clearly labelled sections.
3. Always recommend consulting a healthcare professional.
4. Never claim to diagnose — this is informational support only.
5. Be specific and actionable.

FORMAT YOUR RESPONSE exactly as follows:

## 🔍 About This Condition
[2–3 sentences explaining the condition clearly in plain language]

## 🤒 Why These Symptoms?
[Briefly explain how the reported symptoms relate to this condition]

## ✅ Dos — Recommended Actions
- [Action 1]
- [Action 2]
- [Action 3]
- [Action 4]
- [Action 5]

## ❌ Don'ts — Things to Avoid
- [Avoid 1]
- [Avoid 2]
- [Avoid 3]
- [Avoid 4]

## 🛡️ Precautions
[List the known precautions from the dataset, expanded with practical detail]

## 🏥 When to See a Doctor Immediately
- [Urgent warning sign 1]
- [Urgent warning sign 2]
- [Urgent warning sign 3]

## 💊 Home Care Tips
[2–3 sentences on general home management]

---
⚠️ **Medical Disclaimer**: This information is AI-generated and is NOT a substitute for professional medical advice, diagnosis, or treatment. Please consult a qualified healthcare provider."""


def _build_user_message(
    symptoms: list[str],
    predicted_disease: str,
    patient_info: str,
    dataset_context: str,
    mapped_str: str,
    unknown_str: str,
) -> str:
    symptoms_str = ", ".join(s.replace("_", " ") for s in symptoms)
    return (
        f"Patient Information:\n{patient_info}"
        f"Exactly Matched Symptoms (used in ML prediction): {symptoms_str}\n"
        f"Preliminary ML Prediction: {predicted_disease}\n"
        f"{dataset_context}{mapped_str}{unknown_str}\n"
        f"Please provide comprehensive health guidance based on ALL reported symptoms above."
    )


def _build_context_blocks(
    description: str,
    precautions: list,
    mapped_symptoms: list,
    unknown_symptoms: list,
    age: int,
    gender: str,
    confidence: float,
) -> tuple[str, str, str, str]:
    """Returns (patient_info, dataset_context, mapped_str, unknown_str)."""

    patient_info = ""
    if age:
        patient_info += f"Patient Age: {age}\n"
    if gender:
        patient_info += f"Patient Gender: {gender}\n"
    if confidence:
        patient_info += f"ML Model Confidence: {confidence:.1f}%\n"

    dataset_context = ""
    if description:
        dataset_context += f"\n📋 Clinical Description (from medical dataset):\n{description}\n"
    if precautions:
        prec_str = "\n".join(f"• {p.capitalize()}" for p in precautions if p)
        dataset_context += f"\n🛡️ Known Precautions (from medical dataset):\n{prec_str}\n"

    mapped_str = ""
    if mapped_symptoms:
        lines = []
        for m in mapped_symptoms:
            if isinstance(m, dict):
                inp = m.get("input", "")
                mp  = m.get("mapped_to", "").replace("_", " ")
                lines.append(f"'{inp}' (interpreted as '{mp}')")
        if lines:
            mapped_str = (
                "\n\n🔄 Auto-mapped symptoms (patient's own words → nearest medical term, "
                "also used in ML prediction):\n" + ", ".join(lines)
            )

    unknown_str = ""
    if unknown_symptoms:
        labels = [
            u.get("input", "") if isinstance(u, dict) else str(u)
            for u in unknown_symptoms
        ]
        labels = [l for l in labels if l]
        if labels:
            unknown_str = (
                "\n\n⚠️ Additional free-text symptoms (outside ML dataset — "
                "no close match found, but please address in your suggestions):\n"
                + ", ".join(labels)
            )

    return patient_info, dataset_context, mapped_str, unknown_str


# ── Provider implementations ──────────────────────────────────────────────────

def _call_groq(system_prompt: str, user_message: str) -> str:
    """Call Groq Cloud API."""
    client = _get_groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system",  "content": system_prompt},
            {"role": "user",    "content": user_message},
        ],
        temperature=0.65,
        max_tokens=1200,
    )
    return response.choices[0].message.content


def _call_ollama(system_prompt: str, user_message: str) -> str:
    """Call local Ollama API (meditron:7b or any configured model)."""
    url = f"{OLLAMA_HOST}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "stream": False,
        "options": {
            "temperature": 0.65,
            "num_predict": 1200,
        },
    }
    resp = requests.post(url, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    return data["message"]["content"]


# ── Public interface ──────────────────────────────────────────────────────────

def get_health_suggestions(
    symptoms: list[str],
    predicted_disease: str,
    age: int = None,
    gender: str = None,
    confidence: float = None,
    description: str = "",
    precautions: list[str] = None,
    unknown_symptoms: list = None,
    mapped_symptoms: list = None,
) -> str:
    """
    Generate AI health suggestions using the configured LLM provider.

    Set LLM_PROVIDER=ollama in .env to use local meditron:7b.
    Set LLM_PROVIDER=groq  in .env to use Groq Cloud (default).
    """
    system_prompt = _build_system_prompt()

    patient_info, dataset_context, mapped_str, unknown_str = _build_context_blocks(
        description=description,
        precautions=precautions or [],
        mapped_symptoms=mapped_symptoms or [],
        unknown_symptoms=unknown_symptoms or [],
        age=age,
        gender=gender,
        confidence=confidence,
    )

    user_message = _build_user_message(
        symptoms=symptoms,
        predicted_disease=predicted_disease,
        patient_info=patient_info,
        dataset_context=dataset_context,
        mapped_str=mapped_str,
        unknown_str=unknown_str,
    )

    try:
        if LLM_PROVIDER == "ollama":
            content = _call_ollama(system_prompt, user_message)
        else:
            content = _call_groq(system_prompt, user_message)
        return content

    except requests.exceptions.ConnectionError:
        return (
            f"## ⚠️ Ollama Not Running\n\n"
            f"Could not connect to Ollama at `{OLLAMA_HOST}`.\n\n"
            f"**To fix:**\n"
            f"1. Open a terminal and run: `ollama serve`\n"
            f"2. Make sure `{OLLAMA_MODEL}` is pulled: `ollama pull {OLLAMA_MODEL}`\n"
            f"3. Then retry your analysis.\n\n"
            f"*Alternatively, set `LLM_PROVIDER=groq` in `.env` to use Groq Cloud instead.*\n\n"
            f"⚠️ **Medical Disclaimer**: This is NOT a substitute for professional medical advice."
        )

    except Exception as e:
        # Graceful fallback — show dataset knowledge even if AI fails
        fallback = f"## Health Information for {predicted_disease}\n\n"
        if description:
            fallback += f"**About:** {description}\n\n"
        if mapped_symptoms:
            fallback += "**Auto-mapped symptoms:**\n"
            for m in mapped_symptoms:
                fallback += f"- {m.get('input','')!r} → {m.get('mapped_to','').replace('_',' ')}\n"
            fallback += "\n"
        if precautions:
            fallback += "**Precautions from medical dataset:**\n"
            for p in (precautions or []):
                fallback += f"- {p.capitalize()}\n"
        fallback += (
            f"\n\n_(AI suggestions unavailable: {e})_\n\n"
            "⚠️ **Medical Disclaimer**: This is NOT a substitute for professional medical advice. "
            "Please consult a qualified healthcare provider."
        )
        return fallback


def get_provider_info() -> dict:
    """Return current LLM provider configuration (for UI/API display)."""
    if LLM_PROVIDER == "ollama":
        return {
            "provider": "Ollama (Local)",
            "model":    OLLAMA_MODEL,
            "host":     OLLAMA_HOST,
            "cloud":    False,
        }
    return {
        "provider": "Groq Cloud",
        "model":    GROQ_MODEL,
        "cloud":    True,
    }
