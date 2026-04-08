"""
Load the trained model and predict disease from a list of symptoms.

Feature encoding uses severity weights (from the real Symptom-severity.csv).

Unknown (free-typed) symptoms are:
  1. Fuzzy-matched to the closest known symptom via token overlap scoring
  2. If a close match is found → auto-mapped and INCLUDED in ML prediction
  3. If no match → sent to LLM only (with no effect on ML model)

Returns predicted disease, confidence, top-N predictions,
clinical description, precautions, matched/mapped/unresolved lists.
"""

import os
import re
import numpy as np
import pandas as pd
import joblib
from difflib import get_close_matches

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_model.pkl")

_model_data = None


def _load_model() -> dict:
    """Lazy-load the model bundle on first call."""
    global _model_data
    if _model_data is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Please run: python model/train.py"
            )
        _model_data = joblib.load(MODEL_PATH)
    return _model_data


def _normalize(symptom: str) -> str:
    """Normalise a symptom string → lowercase, underscores."""
    return symptom.strip().lower().replace(" ", "_").replace("-", "_")


def _tokenize(s: str) -> set[str]:
    """Split into meaningful word tokens, ignoring short noise words."""
    stopwords = {"the", "a", "an", "of", "in", "and", "or", "at", "on", "my", "i"}
    return {w for w in re.split(r"[_\s\-]+", s.lower()) if len(w) > 2 and w not in stopwords}


def _find_closest(norm: str, known_feature_set: set, all_features: list) -> str | None:
    """
    Multi-strategy fuzzy match: returns the best known feature name for a
    free-typed symptom, or None if nothing is close enough.

    Strategy priority:
      1. difflib sequence match (handles typos like "stomachache")
      2. Token-overlap: shared words between input and known features
      3. Substring containment both ways
    """
    # 1. difflib — handles typos well
    candidates = get_close_matches(norm, all_features, n=3, cutoff=0.55)
    if candidates:
        return candidates[0]

    # 2. Token overlap scoring
    input_tokens = _tokenize(norm)
    if input_tokens:
        scores = {}
        for feat in all_features:
            feat_tokens = _tokenize(feat)
            overlap = len(input_tokens & feat_tokens)
            if overlap > 0:
                scores[feat] = overlap / max(len(input_tokens), len(feat_tokens))
        if scores:
            best = max(scores, key=scores.get)
            if scores[best] >= 0.4:
                return best

    # 3. Substring containment
    norm_clean = norm.replace("_", "")
    for feat in all_features:
        feat_clean = feat.replace("_", "")
        if norm_clean in feat_clean or feat_clean in norm_clean:
            return feat

    return None


def predict_disease(symptoms: list[str]) -> dict:
    """
    Predict disease from a list of symptom strings.

    All symptoms — both known and free-typed — contribute to prediction:
      • Exact matches        → used directly in ML feature vector
      • Close fuzzy matches  → auto-mapped to nearest known symptom, used in ML
      • No match at all      → passed to LLM context only

    Returns dict with:
        predicted_disease   – top-1 disease name
        confidence          – percentage (0–100)
        top_predictions     – list of {disease, confidence}
        matched_symptoms    – exact matches from the dataset
        mapped_symptoms     – {input, mapped_to} — fuzzy mapped to known symptom
        unknown_symptoms    – {input, closest: None} — no match found
        all_used_symptoms   – everything used in ML (matched + mapped)
        description         – clinical description from symptom_Description.csv
        precautions         – list of precautions from symptom_precaution.csv
    """
    data             = _load_model()
    model            = data["model"]
    feature_columns  = data["feature_columns"]
    severity_weights = data["severity_weights"]
    descriptions     = data.get("descriptions", {})
    precautions_data = data.get("precautions", {})

    known_feature_set = set(feature_columns)

    # ── Classify each input symptom ──────────────────────────────────────────
    matched  = []   # exact — in dataset
    mapped   = []   # fuzzy matched — maps to a known symptom
    unknown  = []   # no match at all — LLM context only

    used_features = set()  # feature columns to activate in vector

    for raw in symptoms:
        norm = _normalize(raw)

        if norm in known_feature_set:
            # ✅ Exact match
            matched.append(norm)
            used_features.add(norm)

        else:
            # 🔍 Try fuzzy match
            closest = _find_closest(norm, known_feature_set, feature_columns)

            if closest:
                # ✅ Auto-mapped to a known symptom → include in ML prediction
                mapped.append({
                    "input":     raw,          # what the user typed
                    "mapped_to": closest,      # what we mapped it to
                })
                used_features.add(closest)
            else:
                # ❌ No match — LLM context only
                unknown.append({
                    "input":   raw,
                    "closest": None,
                })

    # ── Build severity-weighted feature vector ────────────────────────────────
    feature_vector = np.zeros(len(feature_columns))
    for i, col in enumerate(feature_columns):
        if col in used_features:
            feature_vector[i] = float(severity_weights.get(col, 1))

    all_used = matched + [m["mapped_to"] for m in mapped]

    if not all_used:
        # Nothing could be mapped at all
        return {
            "predicted_disease": "Insufficient Data",
            "confidence":        0.0,
            "top_predictions":   [],
            "matched_symptoms":  matched,
            "mapped_symptoms":   mapped,
            "unknown_symptoms":  unknown,
            "all_used_symptoms": [],
            "description":       "",
            "precautions":       [],
        }

    # ── Predict ───────────────────────────────────────────────────────────────
    input_df = pd.DataFrame([feature_vector], columns=feature_columns)
    proba    = model.predict_proba(input_df)[0]
    classes  = model.classes_
    idx      = np.argsort(proba)[::-1]

    top_predictions = [
        {"disease": classes[i], "confidence": round(float(proba[i]) * 100, 2)}
        for i in idx[:5]
        if proba[i] > 0.01
    ]

    best_disease = classes[idx[0]]

    # ── Fetch description & precautions ───────────────────────────────────────
    def _find_info(name: str, lookup: dict):
        if name in lookup:
            return lookup[name]
        lc = name.lower()
        for k, v in lookup.items():
            if k.lower() == lc:
                return v
        return None

    desc  = _find_info(best_disease, descriptions) or ""
    precs = _find_info(best_disease, precautions_data) or []

    return {
        "predicted_disease": best_disease,
        "confidence":        round(float(proba[idx[0]]) * 100, 2),
        "top_predictions":   top_predictions,
        "matched_symptoms":  matched,          # exact dataset hits
        "mapped_symptoms":   mapped,           # fuzzy-mapped inputs
        "unknown_symptoms":  unknown,          # unresolvable inputs
        "all_used_symptoms": all_used,         # everything fed to ML
        "description":       desc,
        "precautions":       precs,
    }


if __name__ == "__main__":
    tests = [
        ["headache", "high_fever", "nausea", "stomachache", "body ache", "runny eyes"],
        ["fatigue", "stomachache", "body ache"],
        ["chest pain", "breathlessness", "sweating"],
    ]
    for t in tests:
        r = predict_disease(t)
        print(f"\nInput    : {t}")
        print(f"Disease  : {r['predicted_disease']} ({r['confidence']:.1f}%)")
        print(f"Matched  : {r['matched_symptoms']}")
        print(f"Mapped   : {r['mapped_symptoms']}")
        print(f"Unknown  : {r['unknown_symptoms']}")
        print(f"All used : {r['all_used_symptoms']}")
