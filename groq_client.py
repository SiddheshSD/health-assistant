"""
Groq API client — uses real disease descriptions and precautions from the
user's CSVs to build a richer, more accurate prompt for LLaMA 3.3 70B.
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not set. Add it to your .env file."
            )
        _client = Groq(api_key=api_key)
    return _client


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
    Generate health suggestions using Groq LLaMA 3.3 70B.

    Args:
        symptoms          : exactly matched symptom strings (used in ML prediction)
        predicted_disease : ML-predicted disease name
        age               : optional patient age
        gender            : optional patient gender
        confidence        : ML model confidence (%)
        description       : clinical description from symptom_Description.csv
        precautions       : precautions list from symptom_precaution.csv
        unknown_symptoms  : free-typed symptoms with no dataset match
        mapped_symptoms   : free-typed symptoms auto-mapped to known dataset terms
    """
    client = _get_client()

    # ── Build context block ──────────────────────────────────────────────────
    patient_info = ""
    if age:
        patient_info += f"Patient Age: {age}\n"
    if gender:
        patient_info += f"Patient Gender: {gender}\n"
    if confidence:
        patient_info += f"ML Model Confidence: {confidence:.1f}%\n"

    symptoms_str = ", ".join(s.replace("_", " ") for s in symptoms)

    # Include auto-mapped symptoms in AI prompt
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
                "\n\n🔄 Auto-mapped symptoms (patient's own words mapped to nearest medical term, "
                "also included in ML prediction):\n" + ", ".join(lines)
            )

    # Include truly unknown symptoms in AI prompt
    unknown_str = ""
    if unknown_symptoms:
        unknown_labels = []
        for u in unknown_symptoms:
            if isinstance(u, dict):
                unknown_labels.append(u.get("input", ""))
            else:
                unknown_labels.append(str(u))
        if unknown_labels:
            unknown_str = (
                "\n\n⚠️ Additional symptoms reported by the patient (outside ML dataset — no close match found, "
                "but please address them in your suggestions):\n"
                + ", ".join(unknown_labels)
            )

    # Inject the real dataset knowledge into the prompt
    dataset_context = ""
    if description:
        dataset_context += f"\n📋 Clinical Description (from medical dataset):\n{description}\n"
    if precautions:
        prec_str = "\n".join(f"• {p.capitalize()}" for p in precautions if p)
        dataset_context += f"\n🛡️ Known Precautions (from medical dataset):\n{prec_str}\n"

    system_prompt = """You are a compassionate and knowledgeable AI health assistant.
You are given a preliminary disease prediction from a machine learning model,
real clinical information from a medical dataset, and the patient's reported symptoms.

Your role: provide clear, practical, empathetic health guidance.

RULES:
1. Use the provided clinical description and precautions as your knowledge base — expand on them, don't ignore them.
2. Structure your response in clearly labelled sections.
3. Always recommend consulting a healthcare professional.
4. Never claim to diagnose — this is informational support only.
5. Be specific and actionable.

FORMAT YOUR RESPONSE exactly as follows:

## 🔍 About This Condition
[2–3 sentences explaining the condition clearly in plain language, based on the clinical description]

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

    user_message = f"""Patient Information:
{patient_info}Exactly Matched Symptoms (used in ML prediction): {symptoms_str}
Preliminary ML Prediction: {predicted_disease}
{dataset_context}{mapped_str}{unknown_str}
Please provide comprehensive health guidance based on ALL reported symptoms above."""

    try:
        response = _get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.65,
            max_tokens=1200,
        )
        return response.choices[0].message.content

    except Exception as e:
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
            for p in precautions:
                fallback += f"- {p.capitalize()}\n"
        fallback += (
            f"\n\n_(AI suggestions unavailable: {e})_\n\n"
            "⚠️ **Medical Disclaimer**: This is NOT a substitute for professional medical advice. "
            "Please consult a qualified healthcare provider."
        )
        return fallback
