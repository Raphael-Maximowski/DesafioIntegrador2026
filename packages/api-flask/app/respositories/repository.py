from app.models import Order
from datetime import datetime
from sqlalchemy import func

def _empty_metrics():
    return {
        "total_orders": 0,
        "total_spent": 0,
        "avg_ticket": 0,
        "days_since_last_order": None
    }

def get_orders_by_customer(customer_id):
    orders = Order.query.filter_by(customer_id=customer_id).all()

    return [
        {
            "value": o.total_amount,
            "days_ago": (datetime.utcnow() - o.created_at).days,
        }
        for o in orders
    ]

def get_customers_metrics_paginated(page=1, per_page=20):
    query = Order.query.with_entities(
        Order.customer_id,
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_amount).label("total_spent"),
        func.max(Order.created_at).label("last_order")
    ).group_by(Order.customer_id)

    total = query.count()

    results = query.limit(per_page).offset((page - 1) * per_page).all()

    return results, total