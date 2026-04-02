import os
import re

import matplotlib.pyplot as plt
import pandas as pd


DATA_PATH = "rich_excel_dataset.csv"
OUT_DIR = os.path.join("outputs", "visuals")


def normalize_visa(value: str) -> str:
    if not isinstance(value, str):
        return "UNKNOWN"
    return value.strip().upper()


def is_h1b(value: str) -> bool:
    normalized = normalize_visa(value)
    return bool(re.search(r"H\s*-?\s*1B", normalized))


def save_plot(path: str) -> None:
    plt.tight_layout()
    plt.savefig(path, dpi=160, bbox_inches="tight")
    plt.close()


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    df = pd.read_csv(DATA_PATH, low_memory=False)
    df = df[["visa_class", "processing_days", "case_status", "submission_month", "case_year", "prevailing_wage", "worksite_state"]].copy()

    df["visa_class"] = df["visa_class"].fillna("UNKNOWN").astype(str).str.strip()
    df["processing_days"] = pd.to_numeric(df["processing_days"], errors="coerce")
    df["submission_month"] = pd.to_numeric(df["submission_month"], errors="coerce")
    df["case_year"] = pd.to_numeric(df["case_year"], errors="coerce")
    df["prevailing_wage"] = pd.to_numeric(df["prevailing_wage"], errors="coerce")

    df = df.dropna(subset=["processing_days"])
    df = df[(df["processing_days"] >= 0) & (df["processing_days"] <= 700)]

    df["is_h1b"] = df["visa_class"].apply(is_h1b)

    # 1) Non-H1B median processing by visa class
    non_h1b = df[~df["is_h1b"]].copy()
    non_h1b_top = (
        non_h1b.groupby("visa_class")["processing_days"]
        .median()
        .sort_values(ascending=False)
        .head(10)
    )

    plt.figure(figsize=(11, 6))
    if len(non_h1b_top) > 0:
        non_h1b_top.sort_values().plot(kind="barh", color="#06b6d4")
        plt.title("Non-H1B Visa Classes: Median Processing Days", fontsize=14)
        plt.xlabel("Median Processing Days")
        plt.ylabel("Visa Class")
    else:
        plt.text(0.5, 0.5, "No non-H1B data available", ha="center", va="center")
        plt.axis("off")
    save_plot(os.path.join(OUT_DIR, "07_non_h1b_median_processing.png"))

    # 2) All visas top classes by volume with avg processing
    top_classes = df["visa_class"].value_counts().head(8).index
    class_avg = (
        df[df["visa_class"].isin(top_classes)]
        .groupby("visa_class")["processing_days"]
        .mean()
        .sort_values(ascending=False)
    )

    plt.figure(figsize=(11, 6))
    class_avg.plot(kind="bar", color="#0ea5e9")
    plt.title("All Visa Classes: Average Processing Days (Top by Volume)", fontsize=14)
    plt.xlabel("Visa Class")
    plt.ylabel("Average Processing Days")
    plt.xticks(rotation=25, ha="right")
    save_plot(os.path.join(OUT_DIR, "08_all_visas_avg_processing.png"))

    # 3) Non-H1B case status distribution for top non-H1B classes
    non_h1b_top_classes = non_h1b["visa_class"].value_counts().head(6).index
    status_pivot = (
        non_h1b[non_h1b["visa_class"].isin(non_h1b_top_classes)]
        .pivot_table(index="visa_class", columns="case_status", values="processing_days", aggfunc="count", fill_value=0)
    )

    plt.figure(figsize=(12, 6))
    if len(status_pivot) > 0:
        status_pivot.plot(kind="bar", stacked=True, colormap="tab20", ax=plt.gca())
        plt.title("Non-H1B Visa Classes: Case Status Distribution", fontsize=14)
        plt.xlabel("Visa Class")
        plt.ylabel("Case Count")
        plt.xticks(rotation=25, ha="right")
        plt.legend(title="Case Status", bbox_to_anchor=(1.02, 1), loc="upper left")
    else:
        plt.text(0.5, 0.5, "No non-H1B case status data available", ha="center", va="center")
        plt.axis("off")
    save_plot(os.path.join(OUT_DIR, "09_non_h1b_case_status_mix.png"))

    # H-1B exclusive visuals
    h1b = df[df["is_h1b"]].copy()

    # 4) H-1B monthly trend
    h1b_monthly = h1b.groupby("submission_month")["processing_days"].median().sort_index()
    plt.figure(figsize=(10, 5))
    if len(h1b_monthly) > 0:
        plt.plot(h1b_monthly.index, h1b_monthly.values, marker="o", color="#f97316", linewidth=2.4)
        plt.title("H-1B Exclusive: Monthly Median Processing Trend", fontsize=14)
        plt.xlabel("Submission Month")
        plt.ylabel("Median Processing Days")
        plt.xticks(range(1, 13))
        plt.grid(alpha=0.2)
    else:
        plt.text(0.5, 0.5, "No H-1B monthly data available", ha="center", va="center")
        plt.axis("off")
    save_plot(os.path.join(OUT_DIR, "10_h1b_monthly_trend_exclusive.png"))

    # 5) H-1B wage vs processing scatter (sampled for readability)
    h1b_wage = h1b.dropna(subset=["prevailing_wage"]).copy()
    h1b_wage = h1b_wage[(h1b_wage["prevailing_wage"] > 0) & (h1b_wage["prevailing_wage"] < 500000)]
    sample = h1b_wage.sample(min(5000, len(h1b_wage)), random_state=42) if len(h1b_wage) > 0 else h1b_wage

    plt.figure(figsize=(10, 6))
    if len(sample) > 0:
        plt.scatter(sample["prevailing_wage"], sample["processing_days"], alpha=0.18, s=12, c="#2563eb")
        plt.title("H-1B Exclusive: Prevailing Wage vs Processing Days", fontsize=14)
        plt.xlabel("Prevailing Wage")
        plt.ylabel("Processing Days")
        plt.grid(alpha=0.2)
    else:
        plt.text(0.5, 0.5, "No H-1B wage data available", ha="center", va="center")
        plt.axis("off")
    save_plot(os.path.join(OUT_DIR, "11_h1b_wage_vs_processing_exclusive.png"))

    # 6) H-1B top states by median processing
    h1b_state = (
        h1b.dropna(subset=["worksite_state"])
        .groupby("worksite_state")["processing_days"]
        .median()
        .sort_values(ascending=False)
        .head(12)
    )

    plt.figure(figsize=(11, 6))
    if len(h1b_state) > 0:
        h1b_state.sort_values().plot(kind="barh", color="#7c3aed")
        plt.title("H-1B Exclusive: Median Processing Days by Worksite State", fontsize=14)
        plt.xlabel("Median Processing Days")
        plt.ylabel("State")
    else:
        plt.text(0.5, 0.5, "No H-1B state data available", ha="center", va="center")
        plt.axis("off")
    save_plot(os.path.join(OUT_DIR, "12_h1b_state_processing_exclusive.png"))


if __name__ == "__main__":
    main()
