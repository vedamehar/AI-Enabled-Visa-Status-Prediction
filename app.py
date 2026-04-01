"""
AI Enabled Visa Status Prediction & Processing Time Estimator
Flask Web Application
"""

from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os
import json
import math
import sys
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Custom JSON encoder for numpy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.floating, np.integer)):
            return float(obj) if isinstance(obj, np.floating) else int(obj)
        return super().default(obj)

app.json_encoder = NumpyEncoder

# Load the trained models
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')


def safe_joblib_load(path, label=None, required=True):
    """Load model artifacts with actionable diagnostics for deployment failures."""
    artifact_name = label or os.path.basename(path)
    try:
        return joblib.load(path)
    except Exception as exc:
        sklearn_version = 'unknown'
        try:
            import sklearn  # Local import to avoid hard dependency at module parse time.
            sklearn_version = sklearn.__version__
        except Exception:
            pass

        error_message = (
            f"Failed to load artifact '{artifact_name}' from '{path}'.\n"
            f"Root error: {type(exc).__name__}: {exc}\n"
            f"Environment versions -> numpy: {np.__version__}, joblib: {joblib.__version__}, "
            f"scikit-learn: {sklearn_version}.\n"
            "This usually indicates a serialization version mismatch. "
            "Re-save artifacts with current environment using model_artifacts.py and redeploy."
        )
        print(error_message, file=sys.stderr)
        if required:
            raise RuntimeError(error_message) from exc
        return None

# Legacy models (fallback)
TUNED_MODEL_PATH = os.path.join(MODELS_DIR, 'visa_processing_model_xgb_tuned.pkl')
BASELINE_MODEL_PATH = os.path.join(MODELS_DIR, 'visa_processing_model.pkl')
ENCODER_PATH = os.path.join(MODELS_DIR, 'case_status_encoder.pkl')

# New multi-visa models
ENSEMBLE_MODEL_PATH = os.path.join(MODELS_DIR, 'visa_ensemble_model.pkl')
VISA_ENCODERS_PATH = os.path.join(MODELS_DIR, 'visa_encoders.pkl')
TRAINING_METADATA_PATH = os.path.join(MODELS_DIR, 'training_metadata.pkl')

# Determine which models to use
use_new_models = os.path.exists(ENSEMBLE_MODEL_PATH) and os.path.exists(VISA_ENCODERS_PATH)

if use_new_models:
    # Load new multi-visa models
    ensemble_model = safe_joblib_load(ENSEMBLE_MODEL_PATH, label='visa_ensemble_model')
    visa_encoders = safe_joblib_load(VISA_ENCODERS_PATH, label='visa_encoders')
    training_metadata = (
        safe_joblib_load(TRAINING_METADATA_PATH, label='training_metadata', required=False)
        if os.path.exists(TRAINING_METADATA_PATH)
        else {}
    )
    if training_metadata is None:
        training_metadata = {}
    
    # Load visa-specific models where available
    visa_specific_models = {}
    for visa_type in ['H-1B', 'E-3 Australian', 'H-1B1 Singapore', 'H-1B1 Chile']:
        model_file = f"visa_model_{visa_type.replace(' ', '_').replace('-', '_')}.pkl"
        model_path = os.path.join(MODELS_DIR, model_file)
        if os.path.exists(model_path):
            visa_specific_models[visa_type] = safe_joblib_load(model_path, label=f'visa_model:{visa_type}')
    
    model = ensemble_model  # Default fallback
    is_tuned_xgb = False
    case_status_encoder = None
    MAE = 2.95  # Ensemble model MAE from training
    APPROACH = 'dual'  # Support both approaches
else:
    # Fallback to legacy models
    if os.path.exists(TUNED_MODEL_PATH):
        MODEL_PATH = TUNED_MODEL_PATH
    elif os.path.exists(BASELINE_MODEL_PATH):
        MODEL_PATH = BASELINE_MODEL_PATH
    else:
        raise FileNotFoundError('No trained model found in models directory.')
    
    model = safe_joblib_load(MODEL_PATH, label='legacy_model')
    is_tuned_xgb = os.path.basename(MODEL_PATH) == 'visa_processing_model_xgb_tuned.pkl'
    
    case_status_encoder = None
    if is_tuned_xgb and os.path.exists(ENCODER_PATH):
        case_status_encoder = safe_joblib_load(ENCODER_PATH, label='case_status_encoder')
    
    visa_specific_models = {}
    visa_encoders = None
    training_metadata = {}
    MAE = 0.37 if is_tuned_xgb else 4.47
    APPROACH = 'legacy'
CASE_STATUSES = ['CERTIFIED', 'DENIED', 'WITHDRAWN', 'PENDING_REVIEW']
if case_status_encoder is not None:
    CASE_STATUSES = list(case_status_encoder.classes_)
CURRENT_YEAR = datetime.now().year
MIN_CASE_YEAR = 2015

# Visa guidance catalog (MVP rule-based guidance, with H-1B ML prediction support).
VISA_GUIDANCE = {
    "H-1B": {
        "summary": "Specialty occupation visa for skilled workers with employer sponsorship.",
        "eligibility": [
            "Bachelor's degree or higher (or equivalent experience)",
            "Specialty occupation job offer from a U.S. employer",
            "Employer files Labor Condition Application (LCA)",
            "Position requires specialized knowledge"
        ],
        "documents": [
            "Valid passport",
            "Degree certificates and transcripts",
            "Updated resume",
            "Offer letter and job description",
            "LCA copy",
            "Previous immigration records (if any)"
        ],
        "prediction_supported": True,
    },
    "L-1": {
        "summary": "Intracompany transfer visa for managers, executives, or specialized knowledge staff.",
        "eligibility": [
            "Worked for related foreign entity for at least 1 year in last 3 years",
            "Transferring to parent, branch, affiliate, or subsidiary in the U.S.",
            "Role qualifies as L-1A (manager/executive) or L-1B (specialized knowledge)"
        ],
        "documents": [
            "Valid passport",
            "Employment verification letters",
            "Corporate relationship proof between entities",
            "Detailed role and organizational chart",
            "Payroll and tax documentation"
        ],
        "prediction_supported": False,
    },
    "F-1": {
        "summary": "Student visa for full-time academic study in the United States.",
        "eligibility": [
            "Acceptance from SEVP-certified school",
            "Proof of financial support",
            "Intent to maintain non-immigrant status"
        ],
        "documents": [
            "Valid passport",
            "Form I-20",
            "SEVIS fee receipt",
            "Academic records",
            "Financial proof documents"
        ],
        "prediction_supported": False,
    },
    "B-1/B-2": {
        "summary": "Visitor visa for business (B-1) or tourism/medical visits (B-2).",
        "eligibility": [
            "Temporary purpose of travel",
            "Sufficient ties to home country",
            "Ability to fund trip and return"
        ],
        "documents": [
            "Valid passport",
            "DS-160 confirmation",
            "Travel itinerary",
            "Financial statements",
            "Supporting business/medical/tourism proof"
        ],
        "prediction_supported": False,
    },
    "O-1": {
        "summary": "Visa for individuals with extraordinary ability in sciences, arts, education, business, or athletics.",
        "eligibility": [
            "Evidence of extraordinary ability",
            "U.S. employer/agent petition",
            "Advisory opinion from relevant peer group (where required)"
        ],
        "documents": [
            "Valid passport",
            "Awards/publications/evidence portfolio",
            "Contracts or itinerary of events",
            "Letters of recommendation",
            "Peer advisory opinion"
        ],
        "prediction_supported": False,
    },
    "E-3 Australian": {
        "summary": "Specialty occupation visa for Australian citizens.",
        "eligibility": [
            "Must be Australian citizen",
            "Specialty occupation job offer from U.S. employer",
            "Bachelor's degree or higher required",
            "Faster processing than H-1B"
        ],
        "documents": [
            "Valid Australian passport",
            "Birth certificate or Australian citizenship proof",
            "Degree certificates",
            "Job offer letter and position description",
            "I-797 petition approval notice"
        ],
        "prediction_supported": True,  # Now has dedicated model
    },
    "H-1B1 Singapore": {
        "summary": "Free trade agreement visa for Singapore citizens in specialty occupations.",
        "eligibility": [
            "Must be Singapore citizen",
            "Specialty occupation job offer",
            "Bachelor's degree or higher",
            "Annual cap of 5,400 visas"
        ],
        "documents": [
            "Valid Singapore passport",
            "Birth certificate or citizenship proof",
            "Degree certificates and transcripts",
            "Employment offer letter",
            "Skills demonstration documents"
        ],
        "prediction_supported": True,  # Now has dedicated model
    },
    "H-1B1 Chile": {
        "summary": "Free trade agreement visa for Chilean citizens in specialty occupations.",
        "eligibility": [
            "Must be Chilean citizen",
            "Specialty occupation job offer from U.S. employer",
            "Bachelor's degree or higher required",
            "Annual cap of 1,400 visas"
        ],
        "documents": [
            "Valid Chilean passport",
            "Birth certificate",
            "Professional degree or higher education diploma",
            "Job offer letter detailing specialty occupation role",
            "Previous work experience documentation"
        ],
        "prediction_supported": True,  # Now has dedicated model
    },
}


def calculate_confidence_interval(prediction, mae=MAE):
    """Calculate confidence interval for prediction"""
    lower_bound = max(0, float(prediction) - float(mae))
    upper_bound = float(prediction) + float(mae)
    return round(float(lower_bound), 2), round(float(upper_bound), 2), round(float(mae), 2)


def round_up_prediction_values(prediction, lower, upper, margin):
    """Round day outputs up to whole-day integers for cleaner UI display."""
    return {
        "predicted_days": int(math.ceil(float(prediction))),
        "range_min": int(math.ceil(float(lower))),
        "range_max": int(math.ceil(float(upper))),
        "confidence_margin": int(math.ceil(float(margin))),
    }


def load_visa_types_from_data():
    """Discover visa types directly from available datasets."""
    dataset_candidates = [
        os.path.join(os.path.dirname(__file__), 'master_h1b_full_dataset.csv'),
        os.path.join(os.path.dirname(__file__), 'rich_excel_dataset.csv'),
    ]

    discovered = set()
    for path in dataset_candidates:
        if not os.path.exists(path):
            continue
        try:
            sample_df = pd.read_csv(path, usecols=['visa_class'], nrows=200000)
            values = sample_df['visa_class'].dropna().astype(str).str.strip().unique().tolist()
            discovered.update(v for v in values if v)
        except Exception:
            continue

    # Always keep the core work-visa classes available in API responses.
    # This prevents UI collapse to a single type when partial datasets/artifacts
    # are present in an environment.
    discovered.update({'H-1B', 'E-3 Australian', 'H-1B1 Singapore', 'H-1B1 Chile'})

    return sorted(discovered)


def get_visa_guidance(visa_type):
    """Return guidance payload for a visa type with a sensible fallback."""
    if visa_type in VISA_GUIDANCE:
        return VISA_GUIDANCE[visa_type]

    return {
        "summary": "General non-immigrant visa guidance.",
        "eligibility": [
            "Confirm purpose-specific eligibility with official USCIS/State guidance",
            "Maintain valid passport and supporting records",
            "Prepare consistent application evidence"
        ],
        "documents": [
            "Valid passport",
            "Completed application forms",
            "Financial/supporting evidence",
            "Travel/employment/academic purpose documents"
        ],
        "prediction_supported": False,
    }


AVAILABLE_VISA_TYPES = load_visa_types_from_data()


# LCA is relevant for these specialty work-visa paths in current model scope.
LCA_REQUIRED_VISA_TYPES = {'H-1B', 'E-3 Australian', 'H-1B1 Singapore', 'H-1B1 Chile'}


def get_visa_prediction_coverage(visa_type):
    """Describe how a visa type is handled by the current model stack."""
    if APPROACH == 'dual':
        if visa_type in visa_specific_models:
            return {
                "coverage_mode": "direct_visa_specific",
                "has_direct_training_data": True,
                "mapped_fallback": False,
                "mapped_to": None,
                "coverage_note": f"{visa_type} uses a dedicated visa-specific model trained on historical records for this visa class."
            }

        visa_classes = set()
        if visa_encoders is not None and 'visa_class' in visa_encoders:
            visa_classes = set(visa_encoders['visa_class'].classes_)

        if visa_type in visa_classes:
            return {
                "coverage_mode": "ensemble_trained",
                "has_direct_training_data": True,
                "mapped_fallback": False,
                "mapped_to": None,
                "coverage_note": f"{visa_type} is handled by the ensemble model with visa class encoding learned from training data."
            }

        return {
            "coverage_mode": "mapped_fallback",
            "has_direct_training_data": False,
            "mapped_fallback": True,
            "mapped_to": "H-1B",
            "coverage_note": f"{visa_type} has no direct training rows in the model dataset. Prediction uses mapped fallback behavior via H-1B encoding in ensemble mode; treat as directional guidance."
        }

    return {
        "coverage_mode": "legacy_h1b",
        "has_direct_training_data": (visa_type == 'H-1B'),
        "mapped_fallback": (visa_type != 'H-1B'),
        "mapped_to": "H-1B" if visa_type != 'H-1B' else None,
        "coverage_note": "Legacy model is H-1B oriented; non-H-1B selections are directional only."
    }


def predict_processing_time(case_status, submission_month, submission_quarter,
                           submission_dayofweek, case_year,
                           submission_day=None, submission_week=None,
                           visa_type='H-1B'):
    """Make prediction using appropriate model based on visa type and approach.
    
    Supports:
    - Approach 1: Visa-specific models (when available and dataset is sufficient)
    - Approach 2: Ensemble model with visa_class as feature (fallback)
    """
    
    if APPROACH == 'dual':
        # NEW MULTI-VISA APPROACH
        if case_status not in CASE_STATUSES:
            raise ValueError(f"Invalid case status. Must be one of: {', '.join(CASE_STATUSES)}")
        
        # Encode case_status and visa_class
        if visa_encoders is None:
            raise ValueError('Visa encoders not loaded')
        
        encoded_case_status = int(visa_encoders['case_status'].transform([case_status])[0])
        
        # Try to encode visa_type, fallback to H-1B encoding if unavailable.
        mapped_fallback = False
        effective_visa_class = visa_type
        try:
            encoded_visa_class = int(visa_encoders['visa_class'].transform([visa_type])[0])
        except:
            encoded_visa_class = int(visa_encoders['visa_class'].transform(['H-1B'])[0])
            mapped_fallback = True
            effective_visa_class = 'H-1B'
        
        # Build feature dataframe (without visa_class for specific models)
        base_features = pd.DataFrame({
            "case_status": [encoded_case_status],
            "submission_month": [submission_month],
            "submission_quarter": [submission_quarter],
            "submission_dayofweek": [submission_dayofweek],
            "case_year": [case_year]
        })
        
        # Model selection logic
        selected_model = None
        model_source = None
        confidence_level = 'high'
        
        # Try Approach 1: Visa-specific model
        if visa_type in visa_specific_models:
            selected_model = visa_specific_models[visa_type]
            model_source = 'visa_specific'
            
            # Check dataset size for confidence marking
            if visa_type in training_metadata.get('approach_1_metrics', {}):
                metrics = training_metadata['approach_1_metrics'][visa_type]
                test_r2 = metrics.get('test_r2', 0)
                samples = metrics.get('samples', 0)
                
                if samples < 5000:
                    confidence_level = 'medium'  # Smaller dataset
                if test_r2 < 0.7:
                    confidence_level = 'medium'  # Lower accuracy
        else:
            # Approach 2: Ensemble model (all visa types)
            selected_model = ensemble_model
            model_source = 'ensemble'
            confidence_level = 'high'
            # Add visa_class feature for ensemble
            base_features['visa_class'] = encoded_visa_class
        
        # Make prediction
        prediction = selected_model.predict(base_features)[0]
        # Convert numpy types to Python native types for JSON serialization
        raw_prediction = float(prediction)
        prediction = round(raw_prediction, 2)
        
        # Get MAE from metadata if available
        current_mae = MAE
        if model_source == 'visa_specific' and visa_type in training_metadata.get('approach_1_metrics', {}):
            current_mae = float(training_metadata['approach_1_metrics'][visa_type].get('mae', MAE))
        elif model_source == 'ensemble':
            current_mae = float(training_metadata.get('approach_2_ensemble', {}).get('mae', MAE))
        
        lower, upper, margin = calculate_confidence_interval(prediction, mae=current_mae)
        
        rounded = round_up_prediction_values(prediction, lower, upper, margin)

        return {
            "predicted_days": rounded["predicted_days"],
            "range_min": rounded["range_min"],
            "range_max": rounded["range_max"],
            "confidence_margin": rounded["confidence_margin"],
            "raw_predicted_days": round(raw_prediction, 4),
            "raw_range_min": round(float(lower), 4),
            "raw_range_max": round(float(upper), 4),
            "raw_confidence_margin": round(float(margin), 4),
            "model_source": model_source,
            "confidence_level": confidence_level,
            "mapped_fallback": mapped_fallback,
            "effective_visa_class": effective_visa_class
        }
    
    else:
        # LEGACY APPROACH (backward compatibility)
        if is_tuned_xgb:
            if case_status_encoder is None:
                raise ValueError('case_status_encoder.pkl is required for tuned XGBoost inference.')

            if case_status not in CASE_STATUSES:
                raise ValueError(f"Invalid case status. Must be one of: {', '.join(CASE_STATUSES)}")

            encoded_case_status = int(case_status_encoder.transform([case_status])[0])

            if submission_day is None:
                submission_day = 15
            if submission_week is None:
                submission_week = int(((submission_month - 1) * 4.345) + 2)

            submission_week = max(1, min(53, int(submission_week)))
            submission_day = max(1, min(31, int(submission_day)))

            input_data = pd.DataFrame({
                "case_status": [encoded_case_status],
                "submission_month": [submission_month],
                "submission_quarter": [submission_quarter],
                "submission_dayofweek": [submission_dayofweek],
                "case_year": [case_year],
                "submission_day": [submission_day],
                "submission_week": [submission_week],
                "is_peak_season": [int(submission_month in [5, 6, 7, 8])],
                "is_year_end": [int(submission_month in [11, 12])],
                "is_weekend": [int(submission_dayofweek in [5, 6])],
                "year_trend": [case_year - MIN_CASE_YEAR],
                "quarter_start": [int(submission_month in [1, 4, 7, 10])]
            })
        else:
            input_data = pd.DataFrame({
                "case_status": [case_status],
                "submission_month": [submission_month],
                "submission_quarter": [submission_quarter],
                "submission_dayofweek": [submission_dayofweek],
                "case_year": [case_year]
            })
        
        prediction = model.predict(input_data)[0]
        # Convert numpy types to Python native types for JSON serialization
        raw_prediction = float(prediction)
        prediction = round(raw_prediction, 2)
        
        lower, upper, margin = calculate_confidence_interval(prediction)
        
        rounded = round_up_prediction_values(prediction, lower, upper, margin)

        return {
            "predicted_days": rounded["predicted_days"],
            "range_min": rounded["range_min"],
            "range_max": rounded["range_max"],
            "confidence_margin": rounded["confidence_margin"],
            "raw_predicted_days": round(raw_prediction, 4),
            "raw_range_min": round(float(lower), 4),
            "raw_range_max": round(float(upper), 4),
            "raw_confidence_margin": round(float(margin), 4),
            "model_source": "legacy",
            "confidence_level": "legacy"
        }


@app.route('/')
def index():
    """Render landing page"""
    return render_template('landing.html')


@app.route('/app')
def app_page():
    """Render the main application page"""
    return render_template('index.html')


@app.route('/api/visa-types', methods=['GET'])
def api_visa_types():
    """List visa types and whether prediction is currently ML-supported."""
    visa_types = []
    for visa_type in AVAILABLE_VISA_TYPES:
        guidance = get_visa_guidance(visa_type)
        coverage = get_visa_prediction_coverage(visa_type)
        visa_types.append({
            "visa_type": visa_type,
            "summary": guidance["summary"],
            "prediction_supported": guidance["prediction_supported"],
            "coverage_mode": coverage["coverage_mode"],
            "has_direct_training_data": coverage["has_direct_training_data"],
            "mapped_fallback": coverage["mapped_fallback"],
            "mapped_to": coverage["mapped_to"],
            "coverage_note": coverage["coverage_note"],
        })

    return jsonify({
        "visa_types": visa_types,
        "count": len(visa_types),
    })


@app.route('/api/visa-guidance', methods=['GET'])
def api_visa_guidance():
    """Return eligibility and document checklist for selected visa type."""
    visa_type = request.args.get('visa_type', '').strip()
    if not visa_type:
        return jsonify({"error": "visa_type query parameter is required"}), 400

    if visa_type not in AVAILABLE_VISA_TYPES:
        return jsonify({"error": f"Unsupported visa_type: {visa_type}"}), 400

    guidance = get_visa_guidance(visa_type)
    coverage = get_visa_prediction_coverage(visa_type)
    return jsonify({
        "visa_type": visa_type,
        "summary": guidance["summary"],
        "eligibility": guidance["eligibility"],
        "documents": guidance["documents"],
        "prediction_supported": guidance["prediction_supported"],
        "coverage_mode": coverage["coverage_mode"],
        "has_direct_training_data": coverage["has_direct_training_data"],
        "mapped_fallback": coverage["mapped_fallback"],
        "mapped_to": coverage["mapped_to"],
        "coverage_note": coverage["coverage_note"],
    })


@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint for predictions"""
    try:
        data = request.get_json()
        
        # Validate inputs
        case_status = data.get('case_status')
        submission_month = int(data.get('submission_month'))
        submission_quarter = int(data.get('submission_quarter'))
        submission_dayofweek = int(data.get('submission_dayofweek'))
        case_year = int(data.get('case_year'))
        submission_day = data.get('submission_day')
        submission_week = data.get('submission_week')
        visa_type = data.get('visa_type', 'H-1B')
        
        # Validate ranges
        if not (1 <= submission_month <= 12):
            return jsonify({"error": "Month must be between 1 and 12"}), 400
        if not (1 <= submission_quarter <= 4):
            return jsonify({"error": "Quarter must be between 1 and 4"}), 400
        if not (0 <= submission_dayofweek <= 6):
            return jsonify({"error": "Day of week must be between 0 and 6"}), 400
        if not (MIN_CASE_YEAR <= case_year <= CURRENT_YEAR):
            return jsonify({"error": f"Year must be between {MIN_CASE_YEAR} and {CURRENT_YEAR}"}), 400
        if submission_day is not None and not (1 <= int(submission_day) <= 31):
            return jsonify({"error": "submission_day must be between 1 and 31"}), 400
        if submission_week is not None and not (1 <= int(submission_week) <= 53):
            return jsonify({"error": "submission_week must be between 1 and 53"}), 400
        if visa_type not in AVAILABLE_VISA_TYPES:
            return jsonify({"error": f"Invalid visa_type. Must be one of: {', '.join(AVAILABLE_VISA_TYPES)}"}), 400

        coverage = get_visa_prediction_coverage(visa_type)

        # Block predictions for visa types without direct training coverage.
        if not coverage.get('has_direct_training_data', False):
            return jsonify({
                "error": (
                    f"Prediction is disabled for {visa_type} because no direct training dataset rows were found for this visa type. "
                    "Guidance/checklist remains available."
                ),
                "coverage_mode": coverage.get('coverage_mode'),
                "coverage_note": coverage.get('coverage_note'),
                "prediction_enabled": False
            }), 400

        # LCA status is mandatory only for LCA-based work visa prediction flow.
        if visa_type in LCA_REQUIRED_VISA_TYPES:
            if case_status not in CASE_STATUSES:
                return jsonify({"error": f"Invalid case status. Must be one of: {', '.join(CASE_STATUSES)}"}), 400
        elif case_status and case_status not in CASE_STATUSES:
            return jsonify({"error": f"Invalid case status. Must be one of: {', '.join(CASE_STATUSES)}"}), 400
        
        # Make prediction (now passes visa_type)
        result = predict_processing_time(case_status, submission_month, submission_quarter,
                                        submission_dayofweek, case_year,
                                        submission_day=submission_day,
                                        submission_week=submission_week,
                                        visa_type=visa_type)

        guidance = get_visa_guidance(visa_type)
        coverage = get_visa_prediction_coverage(visa_type)
        
        # Build scope note based on model source
        model_source = result.get('model_source', 'unknown')
        confidence_level = result.get('confidence_level', 'high')
        
        if model_source == 'visa_specific':
            scope_note = f"ML model trained specifically on {visa_type} historical data. Predictions are based on dedicated visa-type model."
        elif model_source == 'ensemble':
            scope_note = "ML model trained on all visa types with visa classification as a feature. Predictions account for visa-type patterns."
        else:
            scope_note = "Legacy prediction model. For updated predictions, retrain with latest models."
        
        if confidence_level == 'medium':
            scope_note += " [Note: Medium confidence due to smaller dataset or lower model accuracy]"

        if result.get('mapped_fallback'):
            scope_note += (
                f" [Important: {visa_type} is not directly represented in model training rows. "
                f"Prediction used mapped fallback to {result.get('effective_visa_class', 'H-1B')} encoding and should be treated as directional guidance.]"
            )
        
        return jsonify({
            "success": True,
            "visa_type": visa_type,
            "prediction": result,
            "prediction_supported": guidance["prediction_supported"],
            "model_source": model_source,
            "confidence_level": confidence_level,
            "scope_note": scope_note,
            "coverage_mode": coverage["coverage_mode"],
            "has_direct_training_data": coverage["has_direct_training_data"],
            "mapped_fallback": coverage["mapped_fallback"],
            "mapped_to": coverage["mapped_to"],
            "coverage_note": coverage["coverage_note"],
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/prediction-context', methods=['POST'])
def api_prediction_context():
    """Get authentic visualization data for prediction results based on historical dataset analysis"""
    try:
        from prediction_visualization import get_prediction_context_insights
        
        data = request.get_json()
        
        case_status = data.get('case_status', 'CERTIFIED')
        visa_type = data.get('visa_type', 'H-1B')
        submission_month = data.get('submission_month')
        case_year = data.get('case_year')
        
        # Convert to int if provided
        if submission_month:
            submission_month = int(submission_month)
        if case_year:
            case_year = int(case_year)
        
        # Get authentic insights from dataset
        insights = get_prediction_context_insights(
            case_status=case_status,
            visa_type=visa_type,
            submission_month=submission_month,
            case_year=case_year
        )
        
        return jsonify({
            "success": True,
            "context": insights
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/info', methods=['GET'])
def api_info():
    """Get application info and valid values"""
    supports_optional_fields = (
        ["submission_day", "submission_week"] if is_tuned_xgb else []
    )

    if APPROACH == 'dual':
        active_model_file = os.path.basename(ENSEMBLE_MODEL_PATH)
    else:
        active_model_file = os.path.basename(MODEL_PATH)

    response = {
        "app_name": "H-1B Visa Processing Time Estimator",
        "version": "1.1",
        "case_statuses": CASE_STATUSES,
        "visa_types": AVAILABLE_VISA_TYPES,
        "months": list(range(1, 13)),
        "quarters": list(range(1, 5)),
        "days_of_week": {
            0: "Monday",
            1: "Tuesday",
            2: "Wednesday",
            3: "Thursday",
            4: "Friday",
            5: "Saturday",
            6: "Sunday",
        },
        "year_range": {
            "min": MIN_CASE_YEAR,
            "max": CURRENT_YEAR,
        },
        "model_file": active_model_file,
        "supports_optional_fields": supports_optional_fields,
    }

    return jsonify(response)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
