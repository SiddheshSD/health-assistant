#!/usr/bin/env python3
"""
Setup script: generates dataset and trains the ML model.
Run this once before starting the Flask server.
"""

import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)


def main():
    print("=" * 60)
    print("  AI Health Assistant — Setup")
    print("=" * 60)

    # Step 1: Generate dataset
    print("\n[1/2] Generating symptom-disease dataset...")
    from data.generate_dataset import generate_dataset
    import pandas as pd

    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    dataset_path = os.path.join(ROOT, "data", "dataset.csv")

    df = generate_dataset(samples_per_disease=120)
    df.to_csv(dataset_path, index=False)
    print(f"      ✓ Dataset saved: {dataset_path}")
    print(f"      ✓ Shape: {df.shape} ({df['prognosis'].nunique()} diseases, {df.shape[1]-1} symptoms)")

    # Step 2: Train model
    print("\n[2/2] Training Random Forest Classifier...")
    from model.train import train
    accuracy = train()
    print(f"      ✓ Model trained with {accuracy*100:.1f}% accuracy")
    print(f"      ✓ Model saved to: model/saved_model.pkl")

    print("\n" + "=" * 60)
    print("  Setup complete! Start the app with:")
    print("    python app.py")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
