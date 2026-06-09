from datetime import datetime
import pandas as pd

from app.respositories.repository import (
    get_orders_by_customer,
    _empty_metrics,
    get_customers_metrics_paginated
)

from app.services.ml_service import load_model


def build_metrics(row):
    total_orders = row.total_orders if row.total_orders is not None else 0
    total_spent = float(row.total_spent if row.total_spent is not None else 0)

    last_order = row.last_order if row.last_order is not None else datetime.utcnow()

    days_since_last_order = (datetime.utcnow() - last_order).days
    frequency = total_orders / 12

    return {
        "total_orders": total_orders,
        "total_spent": total_spent,
        "avg_ticket": total_spent / total_orders if total_orders else 0,
        "days_since_last_order": days_since_last_order,
        "frequency": frequency
    }


def classify_risk(probability):
    if probability < 0.3:
        return "Baixo"
    elif probability < 0.7:
        return "Médio"
    return "Alto"


def predict_churn_probability(metrics):
    model = load_model("churn")

    FEATURE_COLUMNS = [
        "total_orders",
        "total_spent",
        "avg_ticket",
        "days_since_last_order",
        "frequency"
    ]

    features = pd.DataFrame([[
        metrics[col] for col in FEATURE_COLUMNS
    ]], columns=FEATURE_COLUMNS)

    proba = model.predict_proba(features)[0]
    return round(float(proba[1] if len(proba) > 1 else 0.0), 4)


def predict_purchase_probability(metrics):
    model = load_model("purchase")

    FEATURE_COLUMNS = [
        "total_orders",
        "total_spent",
        "avg_ticket",
        "days_since_last_order",
        "frequency"
    ]

    features = pd.DataFrame([[
        metrics[col] for col in FEATURE_COLUMNS
    ]], columns=FEATURE_COLUMNS)

    proba = model.predict_proba(features)[0]
    return round(float(proba[1] if len(proba) > 1 else 0.0), 4)


def get_customer_metrics(customer_id):
    orders = get_orders_by_customer(customer_id)

    if not orders:
        return {
            "customer_id": customer_id,
            "metrics": _empty_metrics(),
            "churn_probability": 0.0,
            "churn_score": 0.0,
            "risk_level": "Baixo",
            "purchase_probability": 0.0,
            "purchase_score": 0.0,
        }

    total_orders = len(orders)
    total_spent = sum(o["value"] for o in orders)
    avg_ticket = total_spent / total_orders
    days_since_last_order = max(o["days_ago"] for o in orders)

    frequency = total_orders / 12

    metrics = {
        "total_orders": total_orders,
        "total_spent": round(total_spent, 2),
        "avg_ticket": round(avg_ticket, 2),
        "days_since_last_order": days_since_last_order,
        "frequency": round(frequency, 2)
    }

    try:
        churn_prob = predict_churn_probability(metrics)
        purchase_prob = predict_purchase_probability(metrics)
    except (FileNotFoundError, IndexError, ValueError):
        churn_prob = 0.0
        purchase_prob = 0.0

    return {
        "customer_id": customer_id,
        "metrics": metrics,
        "churn_probability": churn_prob,
        "churn_score": round(churn_prob * 100, 2),
        "risk_level": classify_risk(churn_prob),
        "purchase_probability": purchase_prob,
        "purchase_score": round(purchase_prob * 100, 2),
    }


def get_all_customers_metrics(page=1, per_page=20):
    results, total = get_customers_metrics_paginated(page, per_page)

    customers = []

    for row in results:
        metrics = build_metrics(row)

        try:
            churn_prob = predict_churn_probability(metrics)
            purchase_prob = predict_purchase_probability(metrics)
        except (FileNotFoundError, IndexError, ValueError):
            churn_prob = 0.0
            purchase_prob = 0.0

        customers.append({
            "customer_id": row.customer_id,
            "metrics": metrics,
            "churn_probability": churn_prob,
            "churn_score": round(churn_prob * 100, 2),
            "risk_level": classify_risk(churn_prob),
            "purchase_probability": purchase_prob,
            "purchase_score": round(purchase_prob * 100, 2),
        })

    return {
        "items": customers,
        "total": total,
        "page": page,
        "per_page": per_page
    }