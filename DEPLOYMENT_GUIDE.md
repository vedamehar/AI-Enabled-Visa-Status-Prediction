# Flask UI Setup & Running Guide

## 📋 Project Structure
```
archive/
├── app.py                          # Flask backend application
├── requirements.txt                # Python dependencies
├── templates/
│   └── index.html                 # HTML template
├── static/
│   ├── style.css                  # CSS styling
│   └── script.js                  # JavaScript frontend logic
└── models/
    └── visa_processing_model.pkl  # Trained ML model
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```powershell
cd C:\Users\vedam\Downloads\archive
pip install -r requirements.txt
```

### Step 2: Run the Application
```powershell
python app.py
```

### Step 3: Open in Browser
Navigate to:
```
http://127.0.0.1:5000
```

---

## 🎯 Features

✅ **Clean, Modern UI** - Professional web interface with gradient design  
✅ **Easy Input Form** - Dropdowns for all visa parameters  
✅ **Real-time Predictions** - Instant ML model predictions  
✅ **Confidence Intervals** - Shows range of expected processing days  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Error Handling** - Validates inputs and shows helpful error messages  
✅ **Loading States** - Visual feedback during predictions  

---

## 📊 Input Parameters

| Parameter | Type | Valid Values | Description |
|-----------|------|--------------|-------------|
| Case Status | Dropdown | CERTIFIED, DENIED, WITHDRAWN, PENDING_REVIEW | Visa application status |
| Submission Month | Dropdown | 1-12 | Month case was submitted |
| Submission Quarter | Dropdown | 1-4 | Quarter of submission |
| Day of Week | Dropdown | 0-6 (Mon-Sun) | Day of week submitted |
| Case Year | Dropdown | 2015-2025 | Year case was submitted |

---

## 📈 Output

The prediction returns:
- **Estimated Processing Time** (in days)
- **Expected Range** (e.g., 20 - 30 days with 95% confidence)
- **Confidence Margin** (±4.47 days based on model MAE)

---

## 🔧 Troubleshooting

### Issue: "Module not found" errors
**Solution:** Ensure all dependencies are installed:
```powershell
pip install -r requirements.txt
```

### Issue: "Model not found" error
**Solution:** Ensure `visa_processing_model.pkl` exists in the `models/` folder

### Issue: Port 5000 already in use
**Solution:** Modify the port in `app.py`:
```python
app.run(debug=True, host='127.0.0.1', port=5001)  # Change to 5001
```

### Issue: Cannot access http://127.0.0.1:5000
**Solution:** Check if the Flask app is running (look for "Running on" message in terminal)

---

## 🌐 API Endpoints

### GET `/`
Returns the main HTML page

### POST `/api/predict`
Make a prediction with JSON payload:
```json
{
  "case_status": "CERTIFIED",
  "submission_month": 6,
  "submission_quarter": 2,
  "submission_dayofweek": 2,
  "case_year": 2018
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "predicted_days": 45.23,
    "range_min": 40.76,
    "range_max": 49.7,
    "confidence_margin": 4.47
  }
}
```

### GET `/api/info`
Get application information and valid values:
```json
{
  "app_name": "H-1B Visa Processing Time Estimator",
  "version": "1.0",
  "case_statuses": ["CERTIFIED", "DENIED", "WITHDRAWN", "PENDING_REVIEW"],
  "months": [1, 2, ..., 12],
  "quarters": [1, 2, 3, 4],
  "days_of_week": {...},
  "year_range": {"min": 2015, "max": 2026}
}
```

---

## 🎨 Customization

### Change Colors
Edit `static/style.css` - Look for `:root` CSS variables:
```css
:root {
    --primary-color: #2c3e50;        /* Dark blue */
    --secondary-color: #3498db;      /* Light blue */
    --accent-color: #e74c3c;         /* Red */
}
```

### Change Header Text
Edit `templates/index.html`:
```html
<h1>🎓 Your Custom Header Text</h1>
```

### Adjust Model Confidence
Edit `app.py` - Change the `MAE` constant (currently 4.47):
```python
MAE = 5.0  # Adjust uncertainty margin
```

---

## 🚀 Deployment (Zero Cost)

### Recommended: Render Free Web Service (No Cost)

This project is now deployment-ready for Render using:
- `Procfile`
- `render.yaml`
- `gunicorn` in `requirements.txt`

#### Step-by-step:

1. Push your code to GitHub (without huge datasets).
2. Go to Render Dashboard and sign in with GitHub.
3. Click **New +** → **Blueprint**.
4. Select your repository.
5. Render will detect `render.yaml` automatically.
6. Confirm service creation and wait for first build.
7. Open the generated URL (for example: `https://visa-status-predictor.onrender.com`).

#### Important free-tier notes:

- Free web services sleep after inactivity.
- First request after sleep can take 30-90 seconds (cold start).
- Keep total slug/repo size lightweight; do not push large CSV/ZIP files.

---

### Alternative: PythonAnywhere Free Tier

1. Create a free account.
2. Upload code and model files.
3. Create a Flask web app.
4. Set WSGI entry point to `app:app`.

This is also zero-cost, but Render is typically simpler for GitHub auto-deploy.

---

## 📝 Notes

- The model expects specific input format and categorical encoding
- Predictions are based on historical H-1B data (2015-2026)
- Actual processing times may vary based on external factors
- The confidence margin (±4.47 days) is the Mean Absolute Error of the training model

---

## 📧 Support

For issues or questions, check:
- Terminal logs for error messages
- Browser console (Press F12) for frontend errors
- Ensure model file path is correct in `app.py`
