# 🏥 AI Health Assistant

An intelligent symptom checker powered by **Machine Learning** (Random Forest) and **Groq LLaMA 3.3 70B** AI.

## ✨ Features

- **131 Symptoms** from real-world clinical datasets
- **41 Disease predictions** using a severity-weighted Random Forest model
- **Real dataset integration** — `Symptom-severity.csv`, `symptom_Description.csv`, `symptom_precaution.csv`
- **Smart fuzzy symptom matching** — free-typed symptoms like "stomachache" auto-map to "stomach_pain"
- **AI-powered suggestions** — Dos & Don'ts, precautions, when to see a doctor
- **Out-of-vocabulary detection** — shows which symptoms were matched, mapped, or unresolvable
- **Dark glassmorphism UI** — responsive, accessible, mobile-friendly

## 🚀 Setup

### 1. Clone the repository
```bash
git clone https://github.com/SiddheshSD/health-assistant.git
cd health-assistant
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up your API key
Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
```
Get a free API key at [console.groq.com](https://console.groq.com)

### 4. Train the model
```bash
python model/train.py
```
This reads the 3 CSV files in `data/` and saves `model/saved_model.pkl`.

### 5. Run the app
```bash
python app.py
```
Open **http://localhost:5000** in your browser.

## 📁 Project Structure

```
health-assistant/
├── app.py                    # Flask backend (routes: /, /analyze, /symptoms)
├── groq_client.py            # Groq LLaMA 3.3 70B integration
├── requirements.txt
├── .env                      # (create this — not committed)
├── model/
│   ├── train.py              # Random Forest training pipeline
│   ├── predict.py            # Inference with fuzzy symptom mapping
│   └── saved_model.pkl       # (generated — not committed)
├── data/
│   ├── Symptom-severity.csv  # 131 symptoms with severity weights (1–7)
│   ├── symptom_Description.csv  # Clinical descriptions for 41 diseases
│   ├── symptom_precaution.csv   # 4 precautions per disease
│   └── generate_dataset.py   # Dataset generation pipeline
├── templates/
│   └── index.html            # Single-page frontend
└── static/
    └── style.css             # Dark glassmorphism styles
```

## 🧬 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + Flask |
| ML Model | scikit-learn Random Forest |
| AI Suggestions | Groq API (LLaMA 3.3 70B) |
| Frontend | HTML + Vanilla CSS + JS |
| Dataset | Real clinical symptom-disease CSVs |

## ⚠️ Disclaimer

This tool is for **informational and educational purposes only**. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
