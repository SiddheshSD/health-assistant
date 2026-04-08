"""
Generate training dataset from the real symptom datasets provided.

Uses:
 - Symptom-severity.csv   → 134 actual symptoms with severity weights
 - symptom_Description.csv → 41 diseases with clinical descriptions  
 - symptom_precaution.csv  → 4 precautions per disease

The symptom-to-disease mapping is built from the classic Kaggle
symptom-disease associations, then the feature values are
weighted by the real severity scores from Symptom-severity.csv.
"""

import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load real symptom severity weights ────────────────────────────────────────
def load_severity_weights() -> dict:
    path = os.path.join(DATA_DIR, "Symptom-severity.csv")
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    df["Symptom"] = df["Symptom"].str.strip().str.lower().str.replace(" ", "_")
    # drop the spurious 'prognosis' row if present
    df = df[df["Symptom"] != "prognosis"]
    return dict(zip(df["Symptom"], df["weight"].astype(float)))


# ── Load disease descriptions ──────────────────────────────────────────────────
def load_descriptions() -> dict:
    path = os.path.join(DATA_DIR, "symptom_Description.csv")
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    df["Disease"] = df["Disease"].str.strip()
    return dict(zip(df["Disease"], df["Description"]))


# ── Load disease precautions ───────────────────────────────────────────────────
def load_precautions() -> dict:
    path = os.path.join(DATA_DIR, "symptom_precaution.csv")
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    df["Disease"] = df["Disease"].str.strip()
    result = {}
    for _, row in df.iterrows():
        precs = [str(row[c]).strip() for c in df.columns[1:]
                 if pd.notna(row[c]) and str(row[c]).strip() not in ("", "nan")]
        result[row["Disease"]] = precs
    return result


# ── Symptom→Disease mapping (from classic Kaggle dataset) ─────────────────────
# Keyed by disease name as it appears in symptom_Description.csv
DISEASE_SYMPTOMS = {
    "Fungal infection":         ["itching","skin_rash","nodal_skin_eruptions","dischromic_patches"],
    "Allergy":                  ["continuous_sneezing","shivering","chills","watering_from_eyes","runny_nose","redness_of_eyes"],
    "GERD":                     ["stomach_pain","acidity","ulcers_on_tongue","vomiting","cough","chest_pain","indigestion"],
    "Chronic cholestasis":      ["itching","vomiting","yellowish_skin","nausea","loss_of_appetite","abdominal_pain","yellowing_of_eyes","fatigue"],
    "Drug Reaction":            ["itching","skin_rash","stomach_pain","burning_micturition","spotting_urination"],
    "Peptic ulcer diseae":      ["vomiting","indigestion","loss_of_appetite","abdominal_pain","passage_of_gases","internal_itching","fatigue"],
    "AIDS":                     ["muscle_wasting","patches_in_throat","high_fever","extra_marital_contacts","fatigue","weight_loss","receiving_unsterile_injections"],
    "Diabetes":                 ["fatigue","weight_loss","restlessness","lethargy","irregular_sugar_level","polyuria","increased_appetite","excessive_hunger","family_history"],
    "Gastroenteritis":          ["vomiting","sunken_eyes","dehydration","diarrhoea","nausea"],
    "Bronchial Asthma":         ["fatigue","cough","high_fever","breathlessness","family_history","mucoid_sputum"],
    "Hypertension":             ["headache","chest_pain","dizziness","loss_of_balance","lack_of_concentration"],
    "Migraine":                 ["acidity","indigestion","headache","blurred_and_distorted_vision","excessive_hunger","stiff_neck","depression","irritability","visual_disturbances","nausea"],
    "Cervical spondylosis":     ["back_pain","weakness_in_limbs","neck_pain","dizziness","loss_of_balance"],
    "Paralysis (brain hemorrhage)": ["vomiting","headache","weakness_of_one_body_side","altered_sensorium","slurred_speech"],
    "Jaundice":                 ["itching","vomiting","fatigue","weight_loss","high_fever","yellowish_skin","dark_urine","abdominal_pain"],
    "Malaria":                  ["chills","vomiting","high_fever","sweating","headache","nausea","diarrhoea","muscle_pain"],
    "Chicken pox":              ["itching","skin_rash","fatigue","lethargy","high_fever","headache","loss_of_appetite","mild_fever","swelled_lymph_nodes","malaise","red_spots_over_body","watering_from_eyes"],
    "Dengue":                   ["skin_rash","chills","joint_pain","vomiting","fatigue","high_fever","headache","nausea","loss_of_appetite","pain_behind_the_eyes","back_pain","malaise","muscle_pain","red_spots_over_body"],
    "Typhoid":                  ["chills","vomiting","fatigue","high_fever","headache","nausea","constipation","abdominal_pain","diarrhoea","toxic_look_(typhos)","belly_pain"],
    "hepatitis A":              ["joint_pain","vomiting","yellowish_skin","dark_urine","nausea","loss_of_appetite","abdominal_pain","diarrhoea","mild_fever","yellowing_of_eyes","muscle_pain"],
    "Hepatitis B":              ["itching","fatigue","lethargy","yellowish_skin","dark_urine","loss_of_appetite","abdominal_pain","yellowing_of_eyes","receiving_blood_transfusion","receiving_unsterile_injections"],
    "Hepatitis C":              ["fatigue","yellowish_skin","nausea","loss_of_appetite","family_history","yellowing_of_eyes","receiving_blood_transfusion","receiving_unsterile_injections"],
    "Hepatitis D":              ["joint_pain","vomiting","fatigue","yellowish_skin","dark_urine","nausea","loss_of_appetite","abdominal_pain","yellowing_of_eyes","receiving_blood_transfusion","receiving_unsterile_injections"],
    "Hepatitis E":              ["joint_pain","vomiting","fatigue","high_fever","yellowish_skin","dark_urine","nausea","loss_of_appetite","abdominal_pain","yellowing_of_eyes","acute_liver_failure","coma","stomach_bleeding"],
    "Alcoholic hepatitis":      ["vomiting","yellowish_skin","abdominal_pain","swelling_of_stomach","history_of_alcohol_consumption","fluid_overload","distention_of_abdomen"],
    "Tuberculosis":             ["chills","vomiting","fatigue","weight_loss","cough","high_fever","breathlessness","sweating","loss_of_appetite","mild_fever","swelled_lymph_nodes","malaise","phlegm","blood_in_sputum","rusty_sputum"],
    "Common Cold":              ["continuous_sneezing","chills","fatigue","cough","high_fever","headache","swelled_lymph_nodes","malaise","phlegm","throat_irritation","redness_of_eyes","sinus_pressure","runny_nose","congestion","chest_pain","loss_of_smell","muscle_pain"],
    "Pneumonia":                ["chills","fatigue","cough","high_fever","breathlessness","sweating","malaise","phlegm","chest_pain","rusty_sputum","fast_heart_rate"],
    "Dimorphic hemmorhoids(piles)": ["constipation","pain_during_bowel_movements","pain_in_anal_region","bloody_stool","irritation_in_anus"],
    "Heart attack":             ["vomiting","breathlessness","sweating","chest_pain","fast_heart_rate"],
    "Varicose veins":           ["fatigue","cramps","bruising","obesity","swollen_legs","swollen_blood_vessels","prominent_veins_on_calf"],
    "Hypothyroidism":           ["fatigue","weight_gain","cold_hands_and_feets","mood_swings","lethargy","dizziness","puffy_face_and_eyes","enlarged_thyroid","brittle_nails","swollen_extremeties","depression","irritability","abnormal_menstruation"],
    "Hyperthyroidism":          ["fatigue","mood_swings","weight_loss","restlessness","sweating","diarrhoea","fast_heart_rate","excessive_hunger","muscle_weakness","irritability","abnormal_menstruation"],
    "Hypoglycemia":             ["fatigue","anxiety","sweating","headache","nausea","blurred_and_distorted_vision","vomiting","excessive_hunger","drying_and_tingling_lips","slurred_speech","irritability","muscle_weakness","palpitations"],
    "Osteoarthristis":          ["joint_pain","neck_pain","knee_pain","hip_joint_pain","swelling_joints","painful_walking"],
    "Arthritis":                ["muscle_weakness","stiff_neck","swelling_joints","movement_stiffness","loss_of_balance"],
    "(vertigo) Paroymsal  Positional Vertigo": ["vomiting","headache","nausea","spinning_movements","loss_of_balance","unsteadiness"],
    "Acne":                     ["skin_rash","pus_filled_pimples","blackheads","scurring"],
    "Urinary tract infection":  ["burning_micturition","bladder_discomfort","foul_smell_ofurine","continuous_feel_of_urine"],
    "Psoriasis":                ["skin_rash","joint_pain","skin_peeling","silver_like_dusting","small_dents_in_nails","inflammatory_nails"],
    "Impetigo":                 ["skin_rash","high_fever","blister","red_sore_around_nose","yellow_crust_ooze"],
}


def generate_weighted_dataset(
    severity_weights: dict,
    samples_per_disease: int = 120,
    noise_prob: float = 0.04,
    rng_seed: int = 42,
) -> pd.DataFrame:
    """
    Build a training DataFrame where each feature value is the
    severity weight (from Symptom-severity.csv) instead of 0/1.
    Unknown/missing symptoms default to weight=1 if present, 0 if absent.
    """
    rng = np.random.default_rng(rng_seed)

    # Canonical symptom list from the severity file (same order always)
    all_symptoms = sorted(severity_weights.keys())

    rows = []
    for disease, primary_syms in DISEASE_SYMPTOMS.items():
        for _ in range(samples_per_disease):
            row = {sym: 0.0 for sym in all_symptoms}

            # Primary symptoms: include with 90% probability, use severity weight
            for sym in primary_syms:
                if sym in row and rng.random() > 0.1:
                    row[sym] = float(severity_weights.get(sym, 1))

            # Random noise: small chance of adding unrelated symptom
            for sym in all_symptoms:
                if row[sym] == 0 and rng.random() < noise_prob:
                    row[sym] = float(severity_weights.get(sym, 1))

            row["prognosis"] = disease
            rows.append(row)

    df = pd.DataFrame(rows, columns=all_symptoms + ["prognosis"])
    return df


if __name__ == "__main__":
    print("Loading real symptom severity weights...")
    weights = load_severity_weights()
    print(f"  Loaded {len(weights)} symptoms with severity scores")

    print("Generating weighted training dataset...")
    df = generate_weighted_dataset(weights, samples_per_disease=120)
    out = os.path.join(DATA_DIR, "dataset.csv")
    df.to_csv(out, index=False)
    print(f"  Saved → {out}")
    print(f"  Shape: {df.shape}  |  Diseases: {df['prognosis'].nunique()}")
