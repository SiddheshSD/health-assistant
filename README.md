# 🏥 AI Health Assistant

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask)
![scikit-learn](https://img.shields.io/badge/scikit--learn-RandomForest-orange?logo=scikit-learn)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-purple)
![License](https://img.shields.io/badge/License-MIT-green)

**An intelligent symptom checker powered by Machine Learning and Groq LLaMA 3.3 70B AI.**

[Features](#-features) • [Setup](#-setup) • [Usage](#-usage) • [How It Works](#-how-it-works) • [Project Structure](#-project-structure) • [Disclaimer](#%EF%B8%8F-disclaimer)

</div>

---

## ✨ Features

### 🧬 Smart Symptom Input
- **Autocomplete search** — type to search from 131 real clinical symptoms
- **Quick-add buttons** — one-click for common symptoms (Fever, Headache, Nausea, etc.)
- **Free-text input** — type *any* symptom (even not in the dataset) and press **Enter** or click **+ Add**
- **Visual tag system** — colour-coded tags show whether a symptom is known (🔵), mapped (🟠), or unresolvable (⚠️)

### 🤖 3-Strategy Fuzzy Symptom Mapping
When you type a free-text symptom outside the training dataset, the model intelligently maps it:

| Strategy | Example |
|---|---|
| **difflib** (spelling/typo tolerance) | `stomachache` → `stomach_pain` |
| **Token overlap** (shared words) | `body ache` → `muscle_pain` |
| **Substring containment** | `runny eyes` → `redness_of_eyes` |

Mapped symptoms are **included in the ML prediction** — not just discarded.

### 🔬 ML Disease Prediction
- **Random Forest Classifier** trained on real clinical data
- **131 severity-weighted features** — each symptom carries a clinical weight (1–7) instead of a plain 0/1
- **41 disease classes** with top-5 probability breakdown
- **Model confidence score** shown as arc + percentage bar

### 🩺 Real Dataset Integration
Three real-world medical CSV files drive the entire pipeline:

| File | Contents | Used For |
|---|---|---|
| `Symptom-severity.csv` | 131 symptoms + severity weights | ML feature encoding |
| `symptom_Description.csv` | Clinical description per disease | AI prompt context |
| `symptom_precaution.csv` | 4 precautions per disease | AI prompt + response |

### 💬 AI Health Suggestions (LLaMA 3.3 70B)
The Groq AI receives:
- ✅ Exactly matched symptoms
- 🔄 Auto-mapped symptoms with original wording
- ⚠️ Unresolvable free-text symptoms (for LLM context)
- 📋 Real clinical description of the predicted disease
- 🛡️ Known precautions from the dataset

And generates structured guidance:
- About the condition
- Why these symptoms occur
- ✅ Dos / ❌ Don'ts
- 🛡️ Precautions (expanded from dataset)
- 🏥 When to see a doctor immediately
- 💊 Home care tips

### 🎨 Premium UI
- Dark glassmorphism design with gradient accents
- Animated confidence arc + progress bar
- Out-of-vocabulary symptom breakdown panel:
  - 🟢 **Exactly Matched** — dataset hits
  - 🔵 **Auto-Mapped** — `stomachache → stomach pain`
  - 🟠 **Could Not Map** — sent to AI context only
- Mobile responsive, ARIA accessible

---

## 🚀 Setup

### Prerequisites
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/SiddheshSD/health-assistant.git
cd health-assistant
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Train the model
```bash
python model/train.py
```
Reads the 3 CSVs in `data/`, trains a Random Forest on severity-weighted features, and saves `model/saved_model.pkl` with descriptions and precautions bundled inside.

Expected output:
```
Loading real dataset files...
  Symptom-severity.csv  → 131 symptoms
  symptom_Description   → 41 diseases
  symptom_precaution    → 41 diseases

Generating severity-weighted training dataset...
Training Random Forest Classifier...
  Test Accuracy : 99.xx%
  Model saved → model/saved_model.pkl
```

### 5. Run the app
```bash
python app.py
```
Open **http://localhost:5000** in your browser.

---

## 🧪 Usage

### Example Inputs to Try

| Disease | Symptoms to Enter |
|---|---|
| **Dengue** | High Fever, Headache, Joint Pain, Nausea, Muscle Pain, Pain Behind The Eyes |
| **Malaria** | Chills, High Fever, Vomiting, Sweating, Headache |
| **Diabetes** | Fatigue, Weight Loss, Polyuria, Excessive Hunger, Irregular Sugar Level |
| **Pneumonia** | Chills, High Fever, Cough, Breathlessness, Chest Pain, Phlegm |
| **Typhoid** | High Fever, Headache, Nausea, Constipation, Chills, Abdominal Pain |

### Testing Free-Text Input
Try typing these outside the dataset — watch them get auto-mapped:

| You type | Gets mapped to |
|---|---|
| `stomachache` | `stomach_pain` |
| `body ache` | `muscle_pain` |
| `runny eyes` | `redness_of_eyes` |
| `belly pain` | `abdominal_pain` |

---

## ⚙️ How It Works

```
User symptoms (known + free-typed)
         │
         ▼
┌────────────────────────────────────┐
│       predict.py                   │
│  1. Exact match → ML feature vec   │
│  2. Fuzzy match → auto-map + ML    │
│  3. No match    → LLM context only │
└────────────────┬───────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
  Random Forest      groq_client.py
  Classifier         LLaMA 3.3 70B
  (41 diseases)      (health suggestions)
         │                │
         └───────┬────────┘
                 ▼
         Flask /analyze route
                 │
                 ▼
         index.html UI
   (matched / mapped / unknown breakdown
    + confidence score + AI suggestions)
```

---

## 📁 Project Structure

```
health-assistant/
├── app.py                       # Flask app: /, /analyze, /symptoms
├── groq_client.py               # Groq LLaMA 3.3 70B client
├── requirements.txt
├── setup.py                     # One-shot: generate dataset + train model
├── .env                         # ← create this (not committed)
│
├── model/
│   ├── train.py                 # RF training with severity-weighted features
│   ├── predict.py               # 3-strategy fuzzy mapping + inference
│   └── saved_model.pkl          # ← generated (not committed)
│
├── data/
│   ├── Symptom-severity.csv     # 131 symptoms with clinical severity weights
│   ├── symptom_Description.csv  # Clinical descriptions for 41 diseases
│   ├── symptom_precaution.csv   # 4 precautions per disease
│   ├── generate_dataset.py      # Severity-weighted dataset generator
│   └── dataset.csv              # ← generated (not committed)
│
├── templates/
│   └── index.html               # Single-page glassmorphism UI
│
└── static/
    └── style.css                # Dark glassmorphism + animations
```

---

## 📦 Dependencies

```
flask
groq
scikit-learn
pandas
numpy
joblib
python-dotenv
```

---

## 🛡️ API Response Format

`POST /analyze`

**Request:**
```json
{
  "symptoms": ["headache", "stomachache", "high_fever"],
  "age": 28,
  "gender": "Female"
}
```

**Response:**
```json
{
  "predicted_disease": "Typhoid",
  "confidence": 72.4,
  "top_predictions": [
    { "disease": "Typhoid", "confidence": 72.4 },
    { "disease": "Malaria", "confidence": 18.1 }
  ],
  "matched_symptoms": ["headache", "high_fever"],
  "mapped_symptoms": [
    { "input": "stomachache", "mapped_to": "stomach_pain" }
  ],
  "unknown_symptoms": [],
  "all_used_symptoms": ["headache", "high_fever", "stomach_pain"],
  "description": "An infectious disease caused by Salmonella typhi...",
  "precautions": ["eat high calorie veggie food", "antibiotic therapy", ...],
  "suggestions": "## 🔍 About This Condition\n...",
  "disclaimer": "⚠️ This is NOT a substitute for professional medical advice..."
}
```

---

## ⚠️ Disclaimer

This tool is for **informational and educational purposes only**.

It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. The ML model and AI suggestions are based on statistical patterns and may not be accurate for every individual. Always consult a qualified and licensed healthcare professional for any medical concerns.
