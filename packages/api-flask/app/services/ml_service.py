import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from app.models.order import Order
from datetime import datetime
from app.extensions import db
from sqlalchemy import func

CHURN_MODEL_PATH = "churn_model.pkl"
PURCHASE_MODEL_PATH = "purchase_model.pkl"

def load_model(model_type: str = "churn"):
    if model_type == "churn":
        path = CHURN_MODEL_PATH
    elif model_type == "purchase":
        path = PURCHASE_MODEL_PATH
    else:
        raise ValueError("model_type deve ser 'churn' ou 'purchase'")

    if not os.path.exists(path):
        raise FileNotFoundError(f"Modelo {model_type} não encontrado")

    return joblib.load(path)

def train_models():
    dataset = extract_dataset()

    if not dataset:
        raise ValueError("Dataset vazio!")

    df = pd.DataFrame(dataset)
    df = df.fillna(0)

    X = df.drop(["customer_id"], axis=1, errors="ignore")

    df_churn = df.copy()

    df_churn["label"] = df_churn["days_since_last_order"].apply(
        lambda x: 1 if x > 90 else 0
    )

    y_churn = df_churn["label"]

    model_churn = RandomForestClassifier(n_estimators=200, random_state=42)
    model_churn.fit(X, y_churn)

    joblib.dump(model_churn, "churn_model.pkl")

    print("Modelo churn treinado")

    df_purchase = df.copy()

    df_purchase["label"] = df_purchase["days_since_last_order"].apply(
        lambda x: 1 if x <= 30 else 0
    )

    y_purchase = df_purchase["label"]

    model_purchase = RandomForestClassifier(n_estimators=200, random_state=42)
    model_purchase.fit(X, y_purchase)

    joblib.dump(model_purchase, "purchase_model.pkl")

    print("Modelo purchase treinado")

def extract_dataset():
    results = db.session.query(
        Order.customer_id,
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_amount).label("total_spent"),
        func.max(Order.created_at).label("last_order")
    ).group_by(Order.customer_id).all()

    dataset = []

    for row in results:
        total_orders = row.total_orders
        total_spent = float(row.total_spent or 0)
        avg_ticket = total_spent / total_orders if total_orders > 0 else 0

        days_since_last_order = (datetime.utcnow() - row.last_order).days

        frequency = total_orders / 12

        dataset.append({
            "customer_id": str(row.customer_id),
            "total_orders": total_orders,
            "total_spent": round(total_spent, 2),
            "avg_ticket": round(avg_ticket, 2),
            "days_since_last_order": days_since_last_order,
            "frequency": round(frequency, 2)
        })

    return dataset
