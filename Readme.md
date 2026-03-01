# AI Enabled Visa Status Prediction & Processing Time Estimator

---

## 📌 Project Overview

Visa applicants often face long waiting times and uncertainty regarding their application status.  
This project develops a predictive analytics system that estimates visa processing times using historical visa application data.

By analyzing temporal patterns, case status, and structural attributes, the system provides data-driven estimates to improve transparency and applicant experience.

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

# 🎯 Project Objectives

- Predict visa processing time (in days)
- Identify seasonal and temporal trends
- Analyze case-status impact on delays
- Evaluate structural influences (wage, employer, region)
- Develop a web-based estimator tool
- Deploy the solution for real-world usability

---

# 🧱 Project Modules

1. Module 1 – Data Collection & Preprocessing  
2. Module 2 – Exploratory Data Analysis (EDA)  
3. Module 3 – Predictive Modeling  
4. Module 4 – Processing Time Estimator Engine  
5. Module 5 – Deployment & Web Application  

---

# 📦 Module 1: Data Collection & Preprocessing

---

## 📂 Data Sources

Raw datasets (Kaggle):

- H-1B Disclosure Data FY2018
- H1B Non-Immigrant Labour Visa Dataset

These datasets include:

- Case submission dates
- Decision dates
- Case status
- Employer information
- Worksite location
- Wage details
- Job classifications

---

## 🔧 Preprocessing Steps

### 1️⃣ Column Normalization
- Converted column names to lowercase
- Removed whitespace inconsistencies
- Standardized formats

### 2️⃣ Date Conversion
Converted:
- `case_submitted`
- `decision_date`

Invalid records removed.

### 3️⃣ Missing Value Handling
- Dropped records missing critical date fields
- Ensured reliable target computation

### 4️⃣ Target Variable Creation

Processing time calculated as:

processing_days = decision_date - case_submitted

Filtered:
- Removed negative durations
- Removed unrealistic delays (> 365 days)

Final valid range:
1 to 365 days

---

## 🛠 Feature Engineering

Created time-based predictors:

- submission_month
- submission_quarter
- submission_dayofweek
- case_year

These capture seasonal and temporal trends.

---

# 📊 Generated Datasets

---

## 1️⃣ baseline_model_dataset.csv

Primary modeling dataset.

Contains:
- case_status
- processing_days
- submission_month
- submission_quarter
- submission_dayofweek
- case_year
- case_submitted

Advantages:
- Clean feature set
- Minimal missing values
- Lower dimensionality
- Reduced overfitting risk
- High interpretability

---

## 2️⃣ rich_excel_dataset.csv

Extended dataset with structural attributes:

- Employer name
- Wage details
- Worksite state
- Job classification

Used for:
- Feature impact analysis
- Experimental modeling
- Structural influence validation

---

## 3️⃣ master_h1b_full_dataset.csv

Combined large-scale dataset (~3.8M rows).

Used for:
- Scalability testing
- Final validation
- Real-world simulation

---

# 📊 Dataset Usage Strategy & Justification

A progressive experimental strategy was adopted:

### 🔹 Baseline Dataset (Primary Model)

Chosen for final predictive modeling because:

- Fewer parameters
- Lower noise
- Lower risk of overfitting
- Better generalization
- Faculty recommendation alignment

---

### 🔹 Rich Dataset (Experimental Feature Exploration)

Used to test:

- Wage impact
- Employer-level variability
- Regional/state influence
- Structural contribution to prediction accuracy

However:

- Higher dimensionality
- Increased preprocessing complexity
- Greater overfitting risk

Therefore, it is used for experimental validation, not core modeling.

---

### 🔹 Master Dataset (Scalability Validation)

Used to:

- Validate final model robustness
- Test performance on full dataset
- Simulate deployment-scale workload

---

# 📈 Module 2: Exploratory Data Analysis (EDA)

---

## 🎯 Objective

To understand the behavior of visa processing times and identify predictive patterns before building machine learning models.

---

## 🔹 Baseline Dataset Analysis

Visualizations performed:

- Processing Time Distribution
- Processing Time by Case Status
- Monthly Trend Analysis
- Quarterly Trend Analysis
- Year-wise Trend Analysis
- Correlation Heatmap

### Key Insights

- Processing time is right-skewed.
- Majority of cases are processed quickly.
- Case status significantly influences duration.
- Seasonal variation observed across months.
- No severe multicollinearity detected.

These insights guided modeling decisions.

---

## 🔹 Rich Dataset Exploration

Additional analyses performed:

- Wage vs Processing Time
- Top Employer Variability
- State-wise Processing Trends
- Extended Correlation Analysis

### Observations

- Wage introduces variability but limited strong correlation.
- Employer-level differences exist.
- Structural features increase complexity.

Conclusion:
Temporal features provide strong predictive foundation with lower model risk.

---

## 🧠 Impact of EDA on Modeling

Based on EDA findings:

- Log transformation will reduce skewness.
- case_status will be encoded categorically.
- Temporal features retained as core predictors.
- Rich features tested experimentally.

EDA ensures data-driven feature selection.

---

# 🤖 Module 3: Predictive Modeling

Planned models:

- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor

Evaluation Metrics:

- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- R² Score

Objective:
Select best-performing model with optimal bias-variance tradeoff.

---

# ⚙ Module 4: Processing Time Estimator Engine

- Accept user inputs
- Predict expected processing time range
- Provide confidence interval
- Integrate trained model

---

# 🌐 Module 5: Deployment & Web Application

- Build frontend interface
- Connect backend prediction engine
- Display historical trends
- Deploy on cloud platform

---

# 🧠 Experimental Strategy Summary

1. Clean and structure data
2. Perform EDA
3. Compare baseline vs rich feature models
4. Select optimal configuration
5. Validate on master dataset
6. Deploy final estimator

This ensures:

- Scientific workflow
- Transparent experimentation
- Controlled feature expansion
- Generalizable model design

---

# 👨‍💻 Author

Vedant N. Mehar  
B.Tech – Information Technology
AI Enabled Visa Status Prediction & Processing Time Estimator