# AI Enabled Visa Status Prediction & Processing Time Estimator
## Module 1: Data Collection & Preprocessing

---

## 📌 Overview

Module 1 focuses on collecting historical visa datasets, cleaning and preprocessing the data, and generating structured datasets suitable for machine learning.

The objective is to:

- Gather historical visa application data
- Normalize and clean raw datasets
- Handle missing values
- Compute the target variable (processing time)
- Engineer time-based features
- Create structured modeling datasets

---

##  Download Datasets

### Raw Datasets (from Kaggle)

1. **H-1B_Disclosure_Data_FY2018_EOY.xlsx**
   - Download: https://www.kaggle.com/datasets/auygur/h1b-dataset-2017-2018
   - Place in: `raw datasets/` folder

2. **h1b_data.csv**
   - Download: https://www.kaggle.com/datasets/thedevastator/h-1b-non-immigrant-labour-visa
   - Place in: `raw datasets/` folder

### Processed Datasets

The following preprocessed datasets are available on Kaggle:

- **baseline_model_dataset.csv** (~101 MB)
- **master_h1b_full_dataset.csv** (~1.05 GB)
- **rich_excel_dataset.csv** (~252 MB)

Download from Assets section in this repo or you can run the code and generate of your own processed datasets and place in: `processed dataset/` folder

---

## 📂 Input Datasets

Two raw datasets are used:

1. **H-1B_Disclosure_Data_FY2018_EOY.xlsx**
2. **h1b_data.csv**

These contain:

- Application submission dates
- Decision dates
- Visa status
- Employer information
- Worksite location
- Wage details
- Other visa-related attributes

---

## 🔧 Preprocessing Steps

### 1️⃣ Column Normalization
- Converted all column names to lowercase
- Stripped extra whitespace
- Ensured consistent formatting

---

### 2️⃣ Date Formatting
Converted the following columns to datetime format:

- `case_submitted`
- `decision_date`

Invalid dates were coerced to NaT and removed.

---

### 3️⃣ Missing Value Handling
- Removed rows missing essential dates
- Ensured target variable could be computed reliably

---

### 4️⃣ Target Variable Creation

Computed:
processing_days = decision_date - case_submitted


Then filtered:
- Removed negative durations
- Removed unrealistic durations (> 365 days)

Final retained range:
1 to 365 days

---

### 5️⃣ Feature Engineering

Created additional time-based features:

- `submission_month`
- `submission_quarter`
- `submission_dayofweek`
- `case_year`

These features help analyze seasonal and temporal trends.

---

## 📊 Generated Output Datasets

After preprocessing, three datasets are generated:

---

### 1️⃣ master_h1b_full_dataset.csv

Contains:
- Combined Excel + CSV data
- All available features (~69 columns)
- Cleaned and filtered
- Target variable included

Purpose:
- Full data repository
- Feature engineering
- Advanced modeling

---

### 2️⃣ baseline_model_dataset.csv

Contains:
- 7 clean core features
- Minimal missing values
- Entire dataset (~3.8M rows)

Features:
- case_status
- processing_days
- submission_month
- submission_quarter
- submission_dayofweek
- case_year
- case_submitted

Purpose:
- Baseline regression model
- Performance benchmarking

---

### 3️⃣ rich_excel_dataset.csv

Contains:
- Excel-only dataset (~625k rows)
- Rich employer, wage, and location features
- Full structured attributes

Purpose:
- Advanced feature modeling
- Rich-feature regression experiments

---

## 📈 Final Dataset Statistics

- Master dataset rows: ~3.85 million
- Columns retained: ~69
- Target skewness: High (right-skewed distribution)
- Median processing time: 6 days
- Mean processing time: ~11 days

---

## 📌 Module 1 Deliverables

✔ Clean structured dataset  
✔ Computed processing time target  
✔ Feature-engineered dataset  
✔ Multiple modeling-ready subsets  
✔ Missing value validation  
✔ Unrealistic value filtering  

---

## 🚀 Next Module

Module 2: Exploratory Data Analysis (EDA)

Will include:
- Distribution visualization
- Seasonal trend analysis
- Correlation heatmap
- Feature importance exploration

---

Vedant Mehar || 
B.Tech – Information Technology ||
AI Enabled Visa Status Prediction Project ||
Infosys Springboard Intern

---
