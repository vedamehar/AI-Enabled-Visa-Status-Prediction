# ==========================================================
# 🚀 MODULE 2: COMPLETE EDA (DISPLAY VERSION)
# Baseline + Rich Dataset
# ==========================================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

plt.rcParams["figure.figsize"] = (8,5)
sns.set_style("whitegrid")

print("Module 2 - EDA Started 🚀")


# ==========================================================
# 1️⃣ LOAD BASELINE DATASET
# ==========================================================

baseline_path = r'C:\Users\vedam\Downloads\archive\baseline_model_dataset.csv'
df = pd.read_csv(baseline_path, parse_dates=['case_submitted'])

print("Baseline Dataset Shape:", df.shape)


# ==========================================================
# 🔹 BASELINE VISUALS
# ==========================================================

# 1️⃣ Distribution
plt.figure()
sns.histplot(df['processing_days'], bins=50)
plt.title("Processing Time Distribution (Baseline)")
plt.xlabel("Processing Days")
plt.ylabel("Frequency")
plt.show()


# 2️⃣ Case Status
plt.figure()
sns.boxplot(x='case_status',
            y='processing_days',
            data=df)
plt.xticks(rotation=45)
plt.title("Processing Time by Case Status")
plt.show()


# 3️⃣ Monthly Trend
monthly_avg = df.groupby('submission_month')['processing_days'].mean()

plt.figure()
monthly_avg.plot()
plt.title("Monthly Trend")
plt.xlabel("submission_month")
plt.ylabel("Average Processing Days")
plt.show()


# 4️⃣ Quarterly Trend
quarter_avg = df.groupby('submission_quarter')['processing_days'].mean()

plt.figure()
quarter_avg.plot(kind='bar')
plt.title("Quarterly Trend")
plt.xlabel("submission_quarter")
plt.ylabel("Average Processing Days")
plt.show()


# 5️⃣ Year-wise Trend
year_avg = df.groupby('case_year')['processing_days'].mean()

plt.figure()
year_avg.plot()
plt.title("Year-wise Trend")
plt.xlabel("case_year")
plt.ylabel("Average Processing Days")
plt.show()


# 6️⃣ Correlation Heatmap
numeric_cols = [
    'processing_days',
    'submission_month',
    'submission_quarter',
    'submission_dayofweek',
    'case_year'
]

corr = df[numeric_cols].corr()

plt.figure(figsize=(8,6))
sns.heatmap(corr, annot=True)
plt.title("Correlation Heatmap - Baseline")
plt.show()


# ==========================================================
# 2️⃣ LOAD RICH DATASET
# ==========================================================

rich_path = r'C:\Users\vedam\Downloads\archive\rich_excel_dataset.csv'
df_rich = pd.read_csv(rich_path, parse_dates=['case_submitted'])

print("Rich Dataset Shape:", df_rich.shape)


# ==========================================================
# 🔹 RICH VISUALS
# ==========================================================

# 1️⃣ Distribution
plt.figure()
sns.histplot(df_rich['processing_days'], bins=50)
plt.title("Processing Time Distribution (Rich)")
plt.xlabel("Processing Days")
plt.ylabel("Frequency")
plt.show()


# 2️⃣ Case Status (if exists)
if 'case_status' in df_rich.columns:
    plt.figure()
    sns.boxplot(x='case_status',
                y='processing_days',
                data=df_rich)
    plt.xticks(rotation=45)
    plt.title("Processing Time by Case Status (Rich)")
    plt.show()


# 3️⃣ Wage Analysis (Flexible naming)
possible_wage_cols = ['wage', 'prevailing_wage', 'wage_rate_of_pay']

for col in possible_wage_cols:
    if col in df_rich.columns:
        plt.figure()
        sns.scatterplot(x=df_rich[col],
                        y=df_rich['processing_days'],
                        alpha=0.2)
        plt.title(f"{col} vs Processing Time")
        plt.xlabel(col)
        plt.ylabel("Processing Days")
        plt.show()
        break


# 4️⃣ Employer Analysis
if 'employer_name' in df_rich.columns:
    top_emp = df_rich['employer_name'].value_counts().head(10).index
    df_top = df_rich[df_rich['employer_name'].isin(top_emp)]
    
    plt.figure()
    sns.boxplot(x='employer_name',
                y='processing_days',
                data=df_top)
    plt.xticks(rotation=90)
    plt.title("Top 10 Employers Processing Time")
    plt.show()


# 5️⃣ State Analysis (Flexible naming)
possible_state_cols = ['worksite_state', 'state', 'employer_state']

for col in possible_state_cols:
    if col in df_rich.columns:
        state_avg = df_rich.groupby(col)['processing_days'] \
                           .mean() \
                           .sort_values(ascending=False) \
                           .head(10)
        plt.figure()
        state_avg.plot(kind='bar')
        plt.title("Top States - Avg Processing Time")
        plt.ylabel("Average Processing Days")
        plt.show()
        break


# 6️⃣ Correlation (Rich)
numeric_rich = df_rich.select_dtypes(include=['int64','float64']).columns

plt.figure(figsize=(8,6))
sns.heatmap(df_rich[numeric_rich].corr(), annot=False)
plt.title("Correlation Heatmap (Rich)")
plt.show()


print("\nAll Baseline + Rich diagrams displayed successfully ✅")
print("Module 2 Completed 🚀")