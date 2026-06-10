import os
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from app.repositories.repository import (
    extract_dataset,
    get_customer_metrics
)

MODEL_PATH = "models.pkl"

FEATURES = [
    "total_orders",
    "total_spent",
    "avg_ticket",
    "days_since_last_order",
    "frequency"
]


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Não foi encontrado o arquivo de modelo.")

    return joblib.load(MODEL_PATH)

def pipeline_process_data(df):
    if isinstance(df, dict):
        df = pd.DataFrame([df])

    df = df.copy()

    if "customer_id" in df.columns:
        df = df.dropna(subset=["customer_id"])

    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0

    df["total_orders"] = df["total_orders"].fillna(0)
    df["total_spent"] = df["total_spent"].fillna(0)
    df["frequency"] = df["frequency"].fillna(0)

    if df["avg_ticket"].isna().all():
        df["avg_ticket"] = 0
    else:
        df["avg_ticket"] = df["avg_ticket"].fillna(df["avg_ticket"].median())

    df["days_since_last_order"] = df["days_since_last_order"].fillna(999)

    return df

def train_models():
    dataset, dataset_size = extract_dataset()

    if not dataset:
        raise ValueError("Dataset vazio!")

    df = pd.DataFrame(dataset)
    df = pipeline_process_data(df)

    risk = (
        0.4 * (df["days_since_last_order"] / (df["days_since_last_order"].max() or 1)) +
        0.3 * (1 - df["frequency"] / (df["frequency"].max() or 1)) +
        0.2 * (1 - df["total_spent"] / (df["total_spent"].max() or 1)) +
        0.1 * (1 - df["avg_ticket"] / (df["avg_ticket"].max() or 1))
    )

    risk = np.clip(risk, 0, 1)

    probability = 1 / (1 + np.exp(-5 * (risk - 0.5)))
    probability += np.random.normal(0, 0.05, len(df))
    probability = np.clip(probability, 0, 1)

    y_churn = np.random.binomial(1, probability)

    max_days = df["days_since_last_order"].max() or 1

    scoring_df = df.copy()

    scoring_df["score"] = (
        0.4 * (scoring_df["total_spent"] / (scoring_df["total_spent"].max() or 1)) +
        0.3 * scoring_df["frequency"] +
        0.3 * (1 - scoring_df["days_since_last_order"] / max_days)
    ) * 100

    scoring_df["score"] = scoring_df["score"].clip(0, 100)

    X = df[FEATURES]

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled,
        y_churn,
        test_size=0.2,
        random_state=42,
        stratify=y_churn
    )

    churn_model = RandomForestClassifier(
        n_estimators=200,
        random_state=42
    )

    churn_model.fit(X_train, y_train)

    y_pred_churn = churn_model.predict(X_test)

    metrics_churn = {
        "accuracy": accuracy_score(y_test, y_pred_churn),
        "precision": precision_score(y_test, y_pred_churn, zero_division=0),
        "recall": recall_score(y_test, y_pred_churn, zero_division=0),
        "f1_score": f1_score(y_test, y_pred_churn, zero_division=0),
        "roc_auc": roc_auc_score(y_test, churn_model.predict_proba(X_test)[:, 1])
    }

    y_score = scoring_df["score"]

    X_train_score, X_test_score, y_train_score, y_test_score = train_test_split(
        X_scaled,
        y_score,
        test_size=0.2,
        random_state=42
    )

    scoring_model = RandomForestRegressor(
        n_estimators=200,
        random_state=42
    )

    scoring_model.fit(X_train_score, y_train_score)

    y_pred_score = scoring_model.predict(X_test_score)

    metrics_scoring = {
        "mae": mean_absolute_error(y_test_score, y_pred_score),
        "mse": mean_squared_error(y_test_score, y_pred_score),
        "r2": r2_score(y_test_score, y_pred_score)
    }

    joblib.dump({
        "churn_model": churn_model,
        "scoring_model": scoring_model,
        "scaler": scaler,
        "features": FEATURES
    }, MODEL_PATH)

    return {
        "dataset_size": dataset_size,
        "churn_model_metrics": metrics_churn,
        "scoring_model_metrics": metrics_scoring
    }

def _build_customer_dataframe(customer_id):
    customer = get_customer_metrics(customer_id)

    if not customer:
        raise ValueError(f"Cliente {customer_id} não encontrado.")

    df = pd.DataFrame([{
        "total_orders": customer["total_orders"],
        "total_spent": customer["total_spent"],
        "avg_ticket": customer["avg_ticket"],
        "days_since_last_order": customer["days_since_last_order"],
        "frequency": customer["frequency"]
    }])

    df = pipeline_process_data(df)

    return df[FEATURES]

def predict_churn_customer(customer_id):
    models = load_model()

    customer_df = _build_customer_dataframe(customer_id)

    probability = models["churn_model"].predict_proba(customer_df)[0][1]

    return round(float(probability * 100), 2)


def calculate_scoring_customer(customer_id):
    models = load_model()

    customer_df = _build_customer_dataframe(customer_id)

    score = models["scoring_model"].predict(customer_df)[0]

    return int(round(float(score)))

def detect_outliers(df, column):
    q1 = df[column].quantile(0.25)
    q3 = df[column].quantile(0.75)

    iqr = q3 - q1

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    return df[
        (df[column] < lower_bound) |
        (df[column] > upper_bound)
    ]