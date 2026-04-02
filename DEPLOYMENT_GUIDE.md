# Flask App Setup, Run, and Deployment Guide

## 1. Current Project Structure

```text
archive/
|-- app.py
|-- requirements.txt
|-- Procfile
|-- render.yaml
|-- templates/
|   |-- landing.html
|   `-- index.html
|-- static/
|   |-- style.css
|   |-- react-app.js
|   `-- script.js
`-- models/
    |-- visa_ensemble_model.pkl
    |-- visa_encoders.pkl
    |-- training_metadata.pkl
    |-- visa_model_H_1B.pkl
    |-- visa_model_E_3_Australian.pkl
    |-- visa_model_H_1B1_Singapore.pkl
    |-- visa_model_H_1B1_Chile.pkl
    `-- visa_processing_model.pkl  (legacy fallback)
```

## 2. Quick Start (Local)

### Step 1: Open the project directory

```powershell
cd C:\Users\vedam\Downloads\archive
```

### Step 2: Activate virtual environment

```powershell
& .\.venv\Scripts\Activate.ps1
```

### Step 3: Install dependencies

```powershell
pip install -r requirements.txt
```

### Step 4: Run the Flask app

```powershell
python app.py
```

### Step 5: Open in browser

- Landing page: http://127.0.0.1:5000/
- Main app page: http://127.0.0.1:5000/app

## 3. Runtime Behavior (Important)

- App binds to host 0.0.0.0.
- Port comes from environment variable PORT (defaults to 5000).
- Debug mode is controlled by FLASK_DEBUG=1.
- Preferred inference path is multi-visa ensemble + visa-specific models.
- Legacy single-model fallback exists via visa_processing_model.pkl when ensemble artifacts are unavailable.

## 4. Supported Inputs for Prediction

Required fields for POST /api/predict:

- case_status: CERTIFIED | DENIED | WITHDRAWN | PENDING_REVIEW
- submission_month: 1-12
- submission_quarter: 1-4
- submission_dayofweek: 0-6
- case_year: 2015-current_year
- visa_type: must be one of values returned by GET /api/visa-types

Optional fields:

- nationality: used for eligibility filtering (United States, Australia, Singapore, Chile)
- submission_day: 1-31
- submission_week: 1-53

## 5. API Endpoints (Current)

### GET /

Returns landing.html.

### GET /app

Returns index.html (main UI).

### GET /api/visa-types

Returns available visa types, support metadata, and optional nationality filtering.

Example:

```http
GET /api/visa-types?nationality=Australia
```

### GET /api/visa-guidance

Returns visa summary, eligibility list, document checklist, and model coverage.

Example:

```http
GET /api/visa-guidance?visa_type=E-3%20Australian
```

### POST /api/predict

Predicts processing days with rounded values and raw values.

Sample request:

```json
{
  "case_status": "CERTIFIED",
  "submission_month": 6,
  "submission_quarter": 2,
  "submission_dayofweek": 2,
  "case_year": 2024,
  "visa_type": "H-1B",
  "nationality": "United States"
}
```

Sample response:

```json
{
  "success": true,
  "visa_type": "H-1B",
  "prediction": {
    "predicted_days": 12,
    "range_min": 9,
    "range_max": 15,
    "confidence_margin": 3,
    "raw_predicted_days": 11.62,
    "raw_range_min": 8.67,
    "raw_range_max": 14.57,
    "raw_confidence_margin": 2.95,
    "model_source": "visa_specific",
    "confidence_level": "high",
    "mapped_fallback": false,
    "effective_visa_class": "H-1B"
  }
}
```

### POST /api/prediction-context

Returns dataset-driven contextual insights for charts.

### GET /api/info

Returns app metadata, valid values, active model file, and optional-field support.

## 6. Troubleshooting

### Issue: dependency import errors

```powershell
pip install -r requirements.txt
```

### Issue: model artifact load failure or version mismatch

- Error often indicates incompatible joblib/scikit-learn/numpy versions.
- Rebuild artifacts in the current environment and redeploy.
- Keep runtime versions aligned with requirements.txt.

### Issue: "No trained model found in models directory"

Ensure at least one of these is available:

- Preferred: visa_ensemble_model.pkl + visa_encoders.pkl
- Fallback: visa_processing_model.pkl

### Issue: port already in use

```powershell
$env:PORT = 5001
python app.py
```

### Issue: /api/predict returns eligibility error

- nationality must match visa restrictions for E-3 and H-1B1 variants.
- For H-1B, use United States in current app logic.

## 7. Zero-Cost Deployment (Render)

This repository is configured for Render using:

- render.yaml
- Procfile
- gunicorn in requirements.txt

### Steps

1. Push code to GitHub (avoid large dataset files).
2. In Render, click New + and choose Blueprint.
3. Select repository; Render auto-detects render.yaml.
4. Create service and wait for first build.
5. Open deployed URL.

### Free-tier notes

- Service sleeps when idle.
- First request after sleep can take 30-90 seconds.
- Keep repository size lean for faster deploys.

## 8. Optional Manual Production Run

```powershell
gunicorn app:app
```

## 9. Maintenance Checklist

- Keep models/ artifacts in sync with app.py loading logic.
- After retraining, update training_metadata.pkl and encoder artifacts.
- Verify /api/info and /api/visa-types after each model refresh.
- Re-test prediction + context endpoints before release.
