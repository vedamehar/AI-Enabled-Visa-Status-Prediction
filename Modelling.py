"""
AI Enabled Visa Status Prediction & Processing Time Estimator
Module 3: Predictive Modeling (Tuned XGBoost)
"""

import os

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor


print("Loading dataset...")

base_dir = os.path.dirname(os.path.abspath(__file__))
baseline_path = os.path.join(base_dir, "baseline_model_dataset.csv")
models_dir = os.path.join(base_dir, "models")

os.makedirs(models_dir, exist_ok=True)

data = pd.read_csv(baseline_path)

features = [
    "case_status",
    "submission_month",
    "submission_quarter",
    "submission_dayofweek",
    "case_year",
    "submission_day",
    "submission_week",
    "is_peak_season",
    "is_year_end",
    "is_weekend",
    "year_trend",
    "quarter_start",
]

# Keep target/domain filters at training time as a safety check.
data = data.dropna(subset=["processing_days", "case_status"])
data = data[data["processing_days"] <= 60]

# Preferred path: use pre-engineered columns from Preprocessing.py.
# Fallback: build missing engineered columns if an older baseline CSV is loaded.
missing_features = [col for col in features if col not in data.columns]
if missing_features:
    print(f"Baseline dataset is missing engineered features: {missing_features}")
    print("Applying backward-compatible feature engineering in Modelling.py...")

    if "case_submitted" not in data.columns:
        raise ValueError(
            "baseline_model_dataset.csv is missing required columns for fallback feature engineering. "
            "Re-run Preprocessing.py to regenerate the baseline dataset."
        )

    data["case_submitted"] = pd.to_datetime(data["case_submitted"], errors="coerce")
    data = data.dropna(subset=["case_submitted", "submission_month", "submission_quarter", "submission_dayofweek", "case_year"])

    if "submission_day" not in data.columns:
        data["submission_day"] = data["case_submitted"].dt.day
    if "submission_week" not in data.columns:
        data["submission_week"] = data["case_submitted"].dt.isocalendar().week.astype(int)
    if "is_peak_season" not in data.columns:
        data["is_peak_season"] = data["submission_month"].isin([5, 6, 7, 8]).astype(int)
    if "is_year_end" not in data.columns:
        data["is_year_end"] = data["submission_month"].isin([11, 12]).astype(int)
    if "is_weekend" not in data.columns:
        data["is_weekend"] = data["submission_dayofweek"].isin([5, 6]).astype(int)
    if "year_trend" not in data.columns:
        data["year_trend"] = data["case_year"] - data["case_year"].min()
    if "quarter_start" not in data.columns:
        data["quarter_start"] = data["submission_month"].isin([1, 4, 7, 10]).astype(int)

# Encode case_status.
label_encoder = LabelEncoder()
data["case_status"] = label_encoder.fit_transform(data["case_status"])

# Persist encoder to reuse the exact mapping during inference.
encoder_path = os.path.join(models_dir, "case_status_encoder.pkl")
joblib.dump(label_encoder, encoder_path)

X = data[features]
y = data["processing_days"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)

print("Starting hyperparameter tuning...")

param_dist = {
    "n_estimators": [200, 300, 400],
    "max_depth": [6, 8, 10, 12],
    "learning_rate": [0.03, 0.05, 0.07, 0.1],
    "subsample": [0.7, 0.8, 0.9],
    "colsample_bytree": [0.7, 0.8, 0.9],
    "gamma": [0, 0.1, 0.2],
    "min_child_weight": [1, 3, 5],
}

xgb = XGBRegressor(random_state=42, n_jobs=-1)

random_search = RandomizedSearchCV(
    estimator=xgb,
    param_distributions=param_dist,
    n_iter=20,
    scoring="r2",
    cv=3,
    verbose=2,
    random_state=42,
    n_jobs=-1,
)

random_search.fit(X_train, y_train)

print("Best Parameters:", random_search.best_params_)

best_model = random_search.best_estimator_
y_pred = best_model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\n===== Tuned XGBoost Performance =====")
print("MAE:", round(mae, 2))
print("RMSE:", round(rmse, 2))
print("R2 Score:", round(r2, 2))
print("Model Accuracy:", round(r2 * 100, 2), "%")

model_path = os.path.join(models_dir, "visa_processing_model_xgb_tuned.pkl")
joblib.dump(best_model, model_path)
print("Tuned model saved successfully:", model_path)
print("Case-status encoder saved successfully:", encoder_path)
