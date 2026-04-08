"""
Train a Random Forest Classifier on the real symptom-disease dataset.

Uses severity-weighted features from Symptom-severity.csv and
saves the trained model + metadata to model/saved_model.pkl
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
import joblib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

DATA_DIR  = os.path.join(ROOT, "data")
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(DATA_DIR, "dataset.csv")
MODEL_PATH   = os.path.join(MODEL_DIR, "saved_model.pkl")


def train():
    from data.generate_dataset import (
        generate_weighted_dataset,
        load_severity_weights,
        load_descriptions,
        load_precautions,
    )

    # ── Load real datasets ────────────────────────────────────────────────────
    print("Loading real dataset files...")
    severity_weights = load_severity_weights()
    descriptions     = load_descriptions()
    precautions      = load_precautions()
    print(f"  Symptom-severity.csv  → {len(severity_weights)} symptoms")
    print(f"  symptom_Description   → {len(descriptions)} diseases")
    print(f"  symptom_precaution    → {len(precautions)} diseases")

    # ── Generate / load training data ─────────────────────────────────────────
    print("\nGenerating severity-weighted training dataset...")
    df = generate_weighted_dataset(severity_weights, samples_per_disease=120)
    df.to_csv(DATASET_PATH, index=False)
    print(f"  Dataset saved → {DATASET_PATH}")
    print(f"  Shape: {df.shape}  |  Diseases: {df['prognosis'].nunique()}")

    # ── Prepare features ──────────────────────────────────────────────────────
    X = df.drop(columns=["prognosis"])
    y = df["prognosis"]
    feature_columns = list(X.columns)

    # ── Train / test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Random Forest ─────────────────────────────────────────────────────────
    print("\nTraining Random Forest Classifier (severity-weighted features)...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred   = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n  Test Accuracy : {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # ── Serialise everything ──────────────────────────────────────────────────
    model_data = {
        "model":            clf,
        "feature_columns":  feature_columns,
        "severity_weights": severity_weights,
        "diseases":         list(clf.classes_),
        "descriptions":     descriptions,
        "precautions":      precautions,
    }
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model_data, MODEL_PATH)
    print(f"\n  Model saved → {MODEL_PATH}")
    return accuracy


if __name__ == "__main__":
    train()
