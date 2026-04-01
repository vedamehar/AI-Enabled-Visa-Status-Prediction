# ==========================================================
# AI Enabled Visa Status Prediction & Processing Time Estimator
# Module 1: Data Collection & Preprocessing (FINAL VERSION)
# ==========================================================

import pandas as pd
import numpy as np
import os

# ==========================================================
# 1️⃣ FILE PATHS (RAW FILES)
# ==========================================================

excel_path = r'C:\Users\vedam\Downloads\archive\H-1B_Disclosure_Data_FY2018_EOY.xlsx'
csv_path   = r'C:\Users\vedam\Downloads\archive\h1b_data.csv'

# ==========================================================
# 2️⃣ OUTPUT FILE PATHS (WILL BE CREATED)
# ==========================================================

master_path   = r'C:\Users\vedam\Downloads\archive\master_h1b_full_dataset.csv'
baseline_path = r'C:\Users\vedam\Downloads\archive\baseline_model_dataset.csv'
rich_path     = r'C:\Users\vedam\Downloads\archive\rich_excel_dataset.csv'


# ==========================================================
# 3️⃣ LOAD & CLEAN FUNCTION
# ==========================================================

def load_and_clean(file_path):
    
    print(f"\nLoading: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".csv":
        df = pd.read_csv(file_path, low_memory=False)
    else:
        df = pd.read_excel(file_path)
    
    # Normalize column names
    df.columns = df.columns.str.strip().str.lower()
    
    # Convert date columns
    for col in ['case_submitted', 'decision_date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Drop rows missing core dates
    df = df.dropna(subset=['case_submitted', 'decision_date'])
    
    # Compute target variable
    df['processing_days'] = (df['decision_date'] - df['case_submitted']).dt.days
    
    # Remove negative durations
    df = df[df['processing_days'] >= 0]
    
    # Add seasonal features
    df['submission_month'] = df['case_submitted'].dt.month
    df['submission_quarter'] = df['case_submitted'].dt.quarter
    df['submission_dayofweek'] = df['case_submitted'].dt.dayofweek
    df['case_year'] = df['case_submitted'].dt.year
    
    print("Shape after cleaning:", df.shape)
    
    return df


# ==========================================================
# 4️⃣ LOAD BOTH DATASETS
# ==========================================================

df_excel = load_and_clean(excel_path)
df_csv   = load_and_clean(csv_path)


# ==========================================================
# 5️⃣ CREATE FULL MASTER DATASET
# ==========================================================

print("\nCombining Excel + CSV...")

master_df = pd.concat([df_excel, df_csv], ignore_index=True)

# Remove unrealistic delays (1–365 days)
master_df = master_df[
    (master_df['processing_days'] > 0) &
    (master_df['processing_days'] <= 365)
]

print("Master Dataset Shape:", master_df.shape)

# Save master dataset
master_df.to_csv(master_path, index=False)
print("master_h1b_full_dataset.csv created successfully ✅")


# ==========================================================
# 6️⃣ CREATE BASELINE DATASET (7 CLEAN FEATURES)
# ==========================================================

baseline_columns = [
    'case_status',
    'processing_days',
    'submission_month',
    'submission_quarter',
    'submission_dayofweek',
    'case_year',
    'case_submitted'
]

baseline_df = master_df[baseline_columns].copy()

# Handle tiny missing in case_status
baseline_df['case_status'] = baseline_df['case_status'].fillna('Unknown')

# Match the baseline modeling pipeline with a stricter outlier cap.
baseline_df = baseline_df[baseline_df['processing_days'] <= 60]

# Engineer model-ready temporal features for XGBoost workflow.
baseline_df['submission_day'] = baseline_df['case_submitted'].dt.day
baseline_df['submission_week'] = baseline_df['case_submitted'].dt.isocalendar().week.astype(int)
baseline_df['is_peak_season'] = baseline_df['submission_month'].isin([5, 6, 7, 8]).astype(int)
baseline_df['is_year_end'] = baseline_df['submission_month'].isin([11, 12]).astype(int)
baseline_df['is_weekend'] = baseline_df['submission_dayofweek'].isin([5, 6]).astype(int)
baseline_df['year_trend'] = baseline_df['case_year'] - baseline_df['case_year'].min()
baseline_df['quarter_start'] = baseline_df['submission_month'].isin([1, 4, 7, 10]).astype(int)

# Keep rows with valid target and timeline signal values.
baseline_df = baseline_df.dropna(
    subset=['processing_days', 'submission_month', 'submission_quarter', 'submission_dayofweek', 'case_year']
)

baseline_df.to_csv(baseline_path, index=False)
print("baseline_model_dataset.csv created successfully ✅")


# ==========================================================
# 7️⃣ CREATE RICH EXCEL-ONLY DATASET
# ==========================================================

rich_df = df_excel.copy()

# Apply same realistic filtering
rich_df = rich_df[
    (rich_df['processing_days'] > 0) &
    (rich_df['processing_days'] <= 365)
]

rich_df.to_csv(rich_path, index=False)
print("rich_excel_dataset.csv created successfully ✅")


# ==========================================================
# 8️⃣ FINAL SUMMARY
# ==========================================================

print("\n==============================")
print("MASTER DATASET SUMMARY")
print("==============================\n")
print(master_df.describe(include='all'))

print("\n==============================")
print("BASELINE DATASET SUMMARY")
print("==============================\n")
print(baseline_df.describe(include='all'))

print("\n==============================")
print("RICH EXCEL DATASET SUMMARY")
print("==============================\n")
print(rich_df.describe(include='all'))

print("\nModule 1 Completed Successfully 🚀")
