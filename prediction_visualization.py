"""
Authentic Data-Driven Prediction Visualization Generator

Generates realistic charts showing:
1. Historical similar cases: Real cases from dataset with matching criteria
2. Confidence distribution: Actual processing days range for similar visa/status combinations
3. Feature sensitivity: How different factors affect processing times in real data
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

# Load datasets
data_paths = [
    'rich_excel_dataset.csv',
    'master_h1b_full_dataset.csv',
    'processed dataset/master_h1b_full_dataset.csv'
]

df = None
for path in data_paths:
    try:
        df = pd.read_csv(path)
        print(f"Loaded: {path}")
        break
    except FileNotFoundError:
        continue

if df is None:
    raise FileNotFoundError("Could not find any dataset file")

# Normalize column names
df.columns = [col.lower().strip() for col in df.columns]

def normalize_visa(visa_str):
    """Normalize visa type strings"""
    if pd.isna(visa_str):
        return None
    visa_str = str(visa_str).upper().strip()
    
    mapping = {
        'H1B': 'H-1B', 'H-1B': 'H-1B', 'H1': 'H-1B',
        'L1': 'L-1', 'L1A': 'L-1A', 'L1B': 'L-1B',
        'EB2': 'EB-2', 'EB3': 'EB-3', 'EB1': 'EB-1',
        'O1': 'O-1'
    }
    
    for key, val in mapping.items():
        if key in visa_str:
            return val
    return visa_str

def is_h1b(visa_str):
    """Check if visa type is H-1B"""
    return normalize_visa(visa_str) == 'H-1B'

def get_similar_cases_stats(case_status, visa_type, submission_month=None, case_year=None, limit=100):
    """
    Get statistics from actual historical cases matching the prediction inputs.
    Shows real data distribution for similar scenarios.
    """
    try:
        # Column names - these exist in the dataset
        visa_col = 'visa_class'
        status_col = 'case_status'
        days_col = 'processing_days'
        month_col = 'submission_month'
        year_col = 'case_year'
        
        # Start with all data
        filtered = df.copy()
        
        # Filter for matching case status (exact)
        filtered = filtered[filtered[status_col].astype(str).str.upper() == case_status.upper()]
        
        if len(filtered) == 0:
            return None
        
        # Filter for visa type (contains-based, more flexible)
        # H-1B should match "H-1B", "H-1B1 Singapore", "H-1B1 Chile", etc.
        target_visa_base = normalize_visa(visa_type)  # "H-1B"
        
        def visa_matches(visa_str):
            if pd.isna(visa_str):
                return False
            normalized = normalize_visa(visa_str)
            # Check if normalized form matches or starts with target
            return normalized == target_visa_base or str(normalized).startswith(target_visa_base)
        
        filtered = filtered[filtered[visa_col].apply(visa_matches)]
        
        if len(filtered) == 0:
            return None
        
        # Additional filters if provided - but relaxed to get more data
        if submission_month and month_col in df.columns:
            # Only filter if we have substantial data (>5000 rows)
            filtered_by_month = filtered[filtered[month_col] == submission_month]
            if len(filtered_by_month) > 5000:
                filtered = filtered_by_month
        
        if case_year and year_col in df.columns:
            # Look at nearby years (±3 years for more data)
            filtered_by_year = filtered[filtered[year_col].between(case_year - 3, case_year + 1)]
            if len(filtered_by_year) > 5000:
                filtered = filtered_by_year
        
        if len(filtered) == 0:
            return None
        
        # Get statistics
        processing_days = filtered[days_col].dropna().astype(float)
        
        if len(processing_days) == 0:
            return None
        
        return {
            "count": len(processing_days),
            "mean": float(processing_days.mean()),
            "median": float(processing_days.median()),
            "min": float(processing_days.min()),
            "max": float(processing_days.max()),
            "std": float(processing_days.std()),
            "percentile_25": float(processing_days.quantile(0.25)),
            "percentile_75": float(processing_days.quantile(0.75)),
            "percentile_10": float(processing_days.quantile(0.10)),
            "percentile_90": float(processing_days.quantile(0.90))
        }
    except Exception as e:
        print(f"Error in get_similar_cases_stats: {e}")
        import traceback
        traceback.print_exc()
        return None

def get_status_distribution(visa_type):
    """
    Get distribution of case statuses for the given visa type.
    Shows what outcomes are typical for this visa class.
    """
    try:
        visa_col = 'visa_class' if 'visa_class' in df.columns else 'visa_type' if 'visa_type' in df.columns else None
        status_col = 'case_status' if 'case_status' in df.columns else None
        
        if not visa_col or not status_col:
            return None
        
        # Filter for visa type
        filtered = df.copy()
        filtered['normalized_visa'] = filtered[visa_col].apply(normalize_visa)
        filtered = filtered[filtered['normalized_visa'] == normalize_visa(visa_type)]
        
        # Get status distribution
        status_dist = filtered[status_col].value_counts()
        
        return {
            status: {
                "count": int(count),
                "percentage": float(count / len(filtered) * 100)
            }
            for status, count in status_dist.items() if status is not None and status != ''
        }
    except Exception as e:
        print(f"Error in get_status_distribution: {e}")
        return None

def get_monthly_trend(visa_type, case_status=None):
    """
    Get monthly processing days trend for visa type.
    Shows seasonal patterns in real data.
    """
    try:
        visa_col = 'visa_class' if 'visa_class' in df.columns else 'visa_type' if 'visa_type' in df.columns else None
        month_col = 'submission_month' if 'submission_month' in df.columns else None
        days_col = 'processing_days' if 'processing_days' in df.columns else 'days_to_approve' if 'days_to_approve' in df.columns else None
        status_col = 'case_status' if 'case_status' in df.columns else None
        
        if not all([visa_col, month_col, days_col]):
            return None
        
        # Filter for visa type
        filtered = df.copy()
        filtered['normalized_visa'] = filtered[visa_col].apply(normalize_visa)
        filtered = filtered[filtered['normalized_visa'] == normalize_visa(visa_type)]
        
        if case_status and status_col:
            filtered = filtered[filtered[status_col].astype(str).str.upper() == case_status.upper()]
        
        if len(filtered) == 0:
            return None
        
        # Group by month
        monthly = filtered.groupby(month_col)[days_col].agg(['mean', 'median', 'count']).reset_index()
        monthly.columns = ['month', 'avg_days', 'median_days', 'count']
        
        # Ensure all months 1-12 are present (NaN if no data)
        all_months = pd.DataFrame({'month': range(1, 13)})
        monthly = all_months.merge(monthly, on='month', how='left')
        
        return {
            int(row['month']): {
                "avg": float(row['avg_days']) if pd.notna(row['avg_days']) else None,
                "median": float(row['median_days']) if pd.notna(row['median_days']) else None,
                "count": int(row['count']) if pd.notna(row['count']) else 0
            }
            for _, row in monthly.iterrows()
        }
    except Exception as e:
        print(f"Error in get_monthly_trend: {e}")
        return None

def get_prediction_context_insights(case_status, visa_type, submission_month, case_year):
    """
    Generate all context insights for prediction visualization.
    Returns authentic data-driven insights based on prediction inputs.
    """
    return {
        "similar_cases": get_similar_cases_stats(case_status, visa_type, submission_month, case_year),
        "status_dist": get_status_distribution(visa_type),
        "monthly_trend": get_monthly_trend(visa_type, case_status)
    }

# Test the functions
if __name__ == "__main__":
    test_result = get_prediction_context_insights(
        case_status="Certified",
        visa_type="H-1B",
        submission_month=None,  # Don't filter by specific month first
        case_year=None  # Don't filter by specific year first
    )
    print(json.dumps(test_result, indent=2))
