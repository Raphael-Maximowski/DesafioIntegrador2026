from app.repositories.repository import get_customer_metrics

from app.services.ml_service import (
    predict_churn_customer,
    calculate_scoring_customer,
    load_model,
    FEATURES,
    pipeline_process_data
)

from app.repositories.repository import (
    get_customers_metrics_paginated
)

import pandas as pd

def get_customer_analytics(customer_id):
    customer = get_customer_metrics(customer_id)

    if not customer:
        return None

    churn_probability = predict_churn_customer(
        customer_id
    )

    score = calculate_scoring_customer(
        customer_id
    )

    return {
        "customer_id": customer["customer_id"],
        "customer_name": customer["customer_name"],
        "customer_email": customer["customer_email"],

        "metrics": {
            "total_orders": customer["total_orders"],
            "total_spent": customer["total_spent"],
            "avg_ticket": customer["avg_ticket"],
            "days_since_last_order": customer["days_since_last_order"],
            "frequency": customer["frequency"]
        },

        "analytics": {
            "churn_probability": churn_probability,
            "score": score
        }
    }

def get_customers_analytics_paginated(page=1, per_page=20):
    customers, total = get_customers_metrics_paginated(
        page,
        per_page
    )

    if not customers:
        return {
            "data": [],
            "total": total
        }

    result = []

    for customer in customers:
        customer_id = customer["customer_id"]

        result.append({
            "customer_id": customer["customer_id"],
            "customer_name": customer["customer_name"],
            "customer_email": customer["customer_email"],
            "metrics": {
                "total_orders": customer["total_orders"],
                "total_spent": customer["total_spent"],
                "avg_ticket": customer["avg_ticket"],
                "days_since_last_order": customer["days_since_last_order"],
                "frequency": customer["frequency"]
            },
            "analytics": {
                "churn_probability": predict_churn_customer(
                    customer_id
                ),

                "score": calculate_scoring_customer(
                    customer_id
                )
            }
        })

    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "data": result
    }