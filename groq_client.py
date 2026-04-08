"""
LLM client — uses Groq Cloud API (llama-3.3-70b-versatile).
Get a free API key at https://console.groq.com
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not set. Add it to your .env file.\n"
                "Get a free key at https://console.groq.com"
            )
        _client = Groq(api_key=api_key)
    return _client


# ── Prompt builders ───────────────────────────────────────────────────────────

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


def _build_patient_info(age, gender, confidence, profile: dict) -> str:
    p = profile or {}
    info = ""
    name = p.get("full_name", "")
    if name:       info += f"Patient Name: {name}\n"
    _age    = p.get("age") or age
    _gender = p.get("gender") or gender
    if _age:       info += f"Age: {_age}\n"
    if _gender:    info += f"Gender: {_gender}\n"
    if confidence: info += f"ML Model Confidence: {confidence:.1f}%\n"

    bmi = p.get("bmi")
    if bmi:
        info += f"BMI: {bmi} ({p.get('bmi_category','')}) — Height: {p.get('height_cm','')} cm, Weight: {p.get('weight_kg','')} kg\n"

    lifestyle = []
    if p.get("smoking"):           lifestyle.append(f"Smoking: {p['smoking']}")
    if p.get("alcohol"):           lifestyle.append(f"Alcohol: {p['alcohol']}")
    if p.get("physical_activity"): lifestyle.append(f"Activity: {p['physical_activity']}")
    if p.get("sleep_duration"):    lifestyle.append(f"Sleep: {p['sleep_duration']}")
    if p.get("diet_type"):         lifestyle.append(f"Diet: {p['diet_type']}")
    if p.get("stress_level"):      lifestyle.append(f"Stress: {p['stress_level']}")
    if lifestyle:
        info += "Lifestyle: " + " | ".join(lifestyle) + "\n"

    diseases = p.get("existing_diseases", [])
    if diseases and diseases != ["None"]:
        info += f"Known conditions: {', '.join(diseases)}\n"
    allergies = p.get("allergies", "")
    if allergies and allergies.lower() not in ("none", ""):
        info += f"Allergies: {allergies}\n"

    return info + "\n"


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
    profile: dict = None,
) -> str:
    """Generate AI health suggestions using Groq LLaMA 3.3 70B."""

    system_prompt = _build_system_prompt()
    patient_info  = _build_patient_info(age, gender, confidence, profile or {})
    symptoms_str  = ", ".join(s.replace("_", " ") for s in symptoms)

    # Dataset context
    dataset_ctx = ""
    if description:
        dataset_ctx += f"\n📋 Clinical Description (from medical dataset):\n{description}\n"
    if precautions:
        prec_str = "\n".join(f"• {p.capitalize()}" for p in precautions if p)
        dataset_ctx += f"\n🛡️ Known Precautions (from medical dataset):\n{prec_str}\n"

    # Auto-mapped symptoms block
    mapped_str = ""
    if mapped_symptoms:
        lines = [
            f"'{m.get('input','')}' (interpreted as '{m.get('mapped_to','').replace('_',' ')}')"
            for m in mapped_symptoms if isinstance(m, dict)
        ]
        if lines:
            mapped_str = "\n\n🔄 Auto-mapped symptoms (patient's words → nearest medical term):\n" + ", ".join(lines)

    # Unknown symptoms block
    unknown_str = ""
    if unknown_symptoms:
        labels = [u.get("input", "") if isinstance(u, dict) else str(u) for u in unknown_symptoms]
        labels = [l for l in labels if l]
        if labels:
            unknown_str = (
                "\n\n⚠️ Additional free-text symptoms (no dataset match — please address in suggestions):\n"
                + ", ".join(labels)
            )

    user_message = (
        f"Patient Information:\n{patient_info}"
        f"Recognised Symptoms (used in ML prediction): {symptoms_str}\n"
        f"Preliminary ML Prediction: {predicted_disease}\n"
        f"{dataset_ctx}{mapped_str}{unknown_str}\n\n"
        f"Please provide comprehensive health guidance based on ALL reported symptoms above."
    )

    try:
        response = _get_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.65,
            max_tokens=1400,
        )
        return response.choices[0].message.content

    except Exception as e:
        # Graceful fallback — still show dataset knowledge
        fallback = f"## Health Information for {predicted_disease}\n\n"
        if description:
            fallback += f"**About:** {description}\n\n"
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
    """Return LLM provider info for the UI badge."""
    return {
        "provider": "Groq Cloud",
        "model":    GROQ_MODEL,
        "cloud":    True,
    }


def get_chat_response(
    message: str,
    profile: dict,
    history: list[dict],
    max_history: int = 10,
) -> str:
    """
    Context-aware health chatbot using Groq Cloud.

    Args:
        message:     Latest user message.
        profile:     User health profile (age, gender, BMI, lifestyle, etc.).
        history:     Prior messages [{role: "user"|"assistant", content: str}].
        max_history: Max prior turns to include (to stay within context window).

    Returns:
        AI response as a markdown string.
    """
    # Build profile context string
    profile_lines = []
    if profile.get("age"):
        profile_lines.append(f"- Age: {profile['age']}")
    if profile.get("gender"):
        profile_lines.append(f"- Gender: {profile['gender']}")
    if profile.get("bmi"):
        category = profile.get("bmi_category", "")
        profile_lines.append(f"- BMI: {profile['bmi']} ({category})")
    if profile.get("smoking"):
        profile_lines.append(f"- Smoking: {profile['smoking']}")
    if profile.get("alcohol"):
        profile_lines.append(f"- Alcohol: {profile['alcohol']}")
    if profile.get("physical_activity"):
        profile_lines.append(f"- Physical Activity: {profile['physical_activity']}")
    if profile.get("sleep_duration"):
        profile_lines.append(f"- Sleep: {profile['sleep_duration']}")
    if profile.get("diet_type"):
        profile_lines.append(f"- Diet: {profile['diet_type']}")
    if profile.get("stress_level"):
        profile_lines.append(f"- Stress Level: {profile['stress_level']}")
    if profile.get("existing_diseases"):
        diseases = profile["existing_diseases"]
        if diseases and diseases != ["None of the above"]:
            profile_lines.append(f"- Existing conditions: {', '.join(diseases)}")
    if profile.get("allergies"):
        profile_lines.append(f"- Allergies: {profile['allergies']}")

    profile_context = (
        "**User Health Profile:**\n" + "\n".join(profile_lines)
        if profile_lines
        else "No health profile provided."
    )

    system_prompt = f"""You are HealthAI, a warm, knowledgeable, and empathetic AI health assistant.
You provide evidence-based health information in a conversational and easy-to-understand way.

{profile_context}

Your guidelines:
- Use the user's health profile to personalize your responses when relevant
- Be concise but thorough — use bullet points and markdown for clarity
- Always end with a brief reminder to consult a doctor for serious concerns
- Never diagnose — provide information, suggest possibilities, and empower the user
- If symptoms sound urgent (chest pain, difficulty breathing, etc.) always recommend seeking emergency care immediately
- Keep responses friendly and supportive, not clinical or cold
- Respond in the same language the user writes in"""

    # Build message list (system + recent history + new user message)
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (trim to last N turns)
    recent_history = history[-(max_history * 2):]  # each turn = 2 messages
    for h in recent_history:
        if h.get("role") in ("user", "assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})

    messages.append({"role": "user", "content": message})

    try:
        client = _get_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=800,
            temperature=0.6,
        )
        return completion.choices[0].message.content.strip()

    except Exception as e:
        return (
            f"I'm sorry, I couldn't process your request right now "
            f"(error: {e}).\n\nPlease try again in a moment. "
            "For urgent health concerns, please contact a healthcare provider directly."
        )
