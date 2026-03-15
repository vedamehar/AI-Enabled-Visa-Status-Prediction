# ==========================================================
# AI Enabled Visa Status Prediction & Processing Time Estimator
# Module 3: Predictive Modeling
#
# Milestone 3 Objectives:
# 1. Train multiple regression models
# 2. Evaluate using MAE, RMSE, R²
# 3. Compare model performance
# 4. Hyperparameter tune the best model
# 5. Save trained models as checkpoints
# ==========================================================

import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor


# ==========================================================
# 1️⃣ LOAD PREPROCESSED DATASET
# ==========================================================

print("\nLoading preprocessed dataset...")

base_dir = os.path.dirname(os.path.abspath(__file__))
baseline_path = os.path.join(base_dir, 'baseline_model_dataset.csv')
models_dir = os.path.join(base_dir, 'models')

os.makedirs(models_dir, exist_ok=True)

df = pd.read_csv(baseline_path)

print("Dataset Shape:", df.shape)


# ==========================================================
# OPTIONAL: SPEED OPTIMIZATION FOR DEVELOPMENT
# Uncomment if training takes too long
# ==========================================================

# df = df.sample(500000, random_state=42)


# ==========================================================
# 2️⃣ DEFINE FEATURES AND TARGET
# ==========================================================

target = 'processing_days'

features = [
    'case_status',
    'submission_month',
    'submission_quarter',
    'submission_dayofweek',
    'case_year'
]

X = df[features]
y = df[target]


# ==========================================================
# 3️⃣ TRAIN TEST SPLIT
# ==========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training Samples:", X_train.shape)
print("Testing Samples:", X_test.shape)


# ==========================================================
# 4️⃣ PREPROCESSING PIPELINE
# ==========================================================

categorical_features = ['case_status']

numeric_features = [
    'submission_month',
    'submission_quarter',
    'submission_dayofweek',
    'case_year'
]

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
        ('num', 'passthrough', numeric_features)
    ]
)


# ==========================================================
# 5️⃣ DEFINE MODELS
# ==========================================================

models = {

    "Linear Regression": LinearRegression(),

    "Random Forest": RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        random_state=42
    )
}


# ==========================================================
# 6️⃣ TRAIN & EVALUATE MODELS (WITH CHECKPOINTS)
# ==========================================================

print("\nTraining Models...")

results = []

for name, model in models.items():

    model_file = os.path.join(models_dir, f"{name.replace(' ','_')}_model.pkl")

    if os.path.exists(model_file):

        print(f"\nLoading saved model: {name}")
        pipeline = joblib.load(model_file)

    else:

        print(f"\nTraining model: {name}")

        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('model', model)
        ])

        pipeline.fit(X_train, y_train)

        joblib.dump(pipeline, model_file)

        print("Model checkpoint saved:", model_file)

    predictions = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    print(name)
    print("MAE :", mae)
    print("RMSE:", rmse)
    print("R2  :", r2)
    print("-" * 40)


# ==========================================================
# 7️⃣ MODEL COMPARISON
# ==========================================================

results_df = pd.DataFrame(results)

results_file = os.path.join(models_dir, "model_results.csv")

print("\nModel Comparison Results:")
print(results_df)

results_df.to_csv(results_file, index=False)

print("Model comparison saved to", results_file)


# ==========================================================
# 8️⃣ HYPERPARAMETER TUNING (RANDOM FOREST)
# ==========================================================

print("\nStarting Hyperparameter Tuning...")

tuned_model_file = os.path.join(models_dir, "best_random_forest.pkl")

if os.path.exists(tuned_model_file):

    print("Loading tuned model...")
    best_model = joblib.load(tuned_model_file)

else:

    rf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', RandomForestRegressor(random_state=42))
    ])

    param_grid = {

        'model__n_estimators': [100, 200],

        'model__max_depth': [10, 20, None],

        'model__min_samples_split': [2, 5]

    }

    grid_search = GridSearchCV(
        rf_pipeline,
        param_grid,
        cv=3,
        scoring='neg_mean_absolute_error',
        n_jobs=-1,
        verbose=2
    )

    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_

    joblib.dump(best_model, tuned_model_file)

    print("Best Parameters:", grid_search.best_params_)


# ==========================================================
# 9️⃣ FINAL MODEL EVALUATION
# ==========================================================

final_preds = best_model.predict(X_test)

mae = mean_absolute_error(y_test, final_preds)
rmse = np.sqrt(mean_squared_error(y_test, final_preds))
r2 = r2_score(y_test, final_preds)

print("\nFinal Tuned Model Performance")

print("MAE :", mae)
print("RMSE:", rmse)
print("R2  :", r2)


# ==========================================================
# 🔟 SAVE FINAL MODEL
# ==========================================================

final_model_file = os.path.join(models_dir, "visa_processing_model.pkl")

joblib.dump(best_model, final_model_file)

print("\nFinal model saved:", final_model_file)


print("\nModule 3 Completed Successfully 🚀")