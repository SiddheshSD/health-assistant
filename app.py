"""
Flask application for the AI Health Assistant.
Routes:
  GET  /         → Serve the main UI
  POST /analyze  → Run ML prediction + Groq AI suggestions
  GET  /symptoms → Return list of all known symptoms
"""

import os
import sys
import logging
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model.predict import predict_disease
from groq_client import get_health_suggestions, get_provider_info

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load symptom list dynamically from the real Symptom-severity.csv
def _load_all_symptoms() -> list[str]:
    import pandas as pd
    severity_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "data", "Symptom-severity.csv"
    )
    try:
        df = pd.read_csv(severity_path)
        df.columns = df.columns.str.strip()
        df["Symptom"] = df["Symptom"].str.strip().str.lower().str.replace(" ", "_")
        symptoms = [
            s for s in df["Symptom"].tolist()
            if s and s != "prognosis"
        ]
        logger.info(f"Loaded {len(symptoms)} symptoms from Symptom-severity.csv")
        return symptoms
    except Exception as exc:
        logger.warning(f"Could not load Symptom-severity.csv: {exc}. Using fallback list.")
        return []

ALL_SYMPTOMS = _load_all_symptoms()


@app.route("/")
def index():
    """Serve the main UI."""
    return render_template("index.html")


@app.route("/symptoms", methods=["GET"])
def get_symptoms():
    """Return the list of all known symptoms for the frontend."""
    return jsonify({"symptoms": ALL_SYMPTOMS})


@app.route("/provider", methods=["GET"])
def get_provider():
    """Return current LLM provider info."""
    return jsonify(get_provider_info())


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze symptoms and return ML prediction + AI suggestions.

    Expected JSON body:
        {
            "symptoms": ["headache", "fever", ...],
            "age": 30,           (optional)
            "gender": "Male"     (optional)
        }

    Returns JSON:
        {
            "predicted_disease": str,
            "confidence": float,
            "top_predictions": [...],
            "matched_symptoms": [...],
            "suggestions": str,
            "disclaimer": str
        }
    """
    try:
        data = request.get_json(force=True)

        if not data:
            return jsonify({"error": "No JSON body provided."}), 400

        symptoms = data.get("symptoms", [])
        profile  = data.get("profile", {})
        # Back-compat: also accept top-level age/gender
        age    = profile.get("age")    or data.get("age")
        gender = profile.get("gender") or data.get("gender")

        if not symptoms or not isinstance(symptoms, list):
            return jsonify({"error": "Please provide at least one symptom."}), 400

        if len(symptoms) > 20:
            return jsonify({"error": "Too many symptoms provided (max 20)."}), 400

        # Validate age
        if age is not None:
            try:
                age = int(age)
                if age < 1 or age > 120: age = None
            except (ValueError, TypeError):
                age = None

        logger.info(f"Analyzing: symptoms={symptoms}, profile={profile}")

        # Step 1: ML Prediction
        prediction = predict_disease(symptoms)
        predicted_disease = prediction["predicted_disease"]
        confidence = prediction["confidence"]

        logger.info(
            f"ML prediction: {predicted_disease} ({confidence:.1f}%)"
        )

        # Step 2: Groq AI Suggestions (enriched with real dataset knowledge)
        matched_symptoms = prediction.get("matched_symptoms", symptoms)
        description      = prediction.get("description", "")
        precautions      = prediction.get("precautions", [])

        suggestions = get_health_suggestions(
            symptoms=matched_symptoms if matched_symptoms else symptoms,
            predicted_disease=predicted_disease,
            age=age,
            gender=gender,
            confidence=confidence,
            description=description,
            precautions=precautions,
            unknown_symptoms=prediction.get("unknown_symptoms", []),
            mapped_symptoms=prediction.get("mapped_symptoms", []),
            profile=profile,
        )

        return jsonify({
            "predicted_disease": predicted_disease,
            "confidence":        confidence,
            "top_predictions":   prediction.get("top_predictions", []),
            "matched_symptoms":  prediction.get("matched_symptoms", []),
            "mapped_symptoms":   prediction.get("mapped_symptoms", []),
            "unknown_symptoms":  prediction.get("unknown_symptoms", []),
            "all_used_symptoms": prediction.get("all_used_symptoms", []),
            "description":       description,
            "precautions":       precautions,
            "suggestions":       suggestions,
            "llm_provider":      get_provider_info(),
            "disclaimer": (
                "⚠️ This is NOT a substitute for professional medical advice. "
                "This tool is for informational purposes only. "
                "Always consult a qualified healthcare provider for proper diagnosis and treatment."
            ),
        })

    except FileNotFoundError as e:
        logger.error(f"Model not found: {e}")
        return jsonify({
            "error": "ML model not trained yet. Please run: python model/train.py"
        }), 503

    except Exception as e:
        logger.error(f"Error in /analyze: {e}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    logger.info(f"Starting AI Health Assistant on port {port}")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=debug,
        reloader_type="stat",
        exclude_patterns=[
            # Exclude large data files that cause MemoryError in stat reloader
            "*/data/*.csv",
            "*/data/dataset.csv",
            "*/model/saved_model.pkl",
            "*/__pycache__/*",
            "*/.git/*",
        ],
        extra_files=[
            os.path.join(os.path.dirname(__file__), "templates", "index.html"),
            os.path.join(os.path.dirname(__file__), "static", "style.css"),
        ],
    )

