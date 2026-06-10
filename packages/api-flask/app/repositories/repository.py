from app.models import Order
from datetime import datetime
from datetime import datetime
from sqlalchemy import func
from app.extensions import db
from app.models import Customer, Order

def get_customer_metrics(customer_id):
    row = (
        db.session.query(
            Customer.id.label("customer_id"),
            Customer.name.label("customer_name"),
            Customer.email.label("customer_email"),
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("total_spent"),
            func.max(Order.created_at).label("last_order"),
            func.min(Order.created_at).label("first_order")
        ).outerjoin(Order, Customer.id == Order.customer_id
        ).filter(Customer.id == customer_id
        ).group_by(
            Customer.id,
            Customer.name,
            Customer.email
        ).first()
    )

    if not row:
        return None

    total_orders = row.total_orders or 0
    total_spent = float(row.total_spent or 0)

    avg_ticket = (
        total_spent / total_orders
        if total_orders > 0 else 0
    )

    days_since_last_order = (
        (datetime.utcnow() - row.last_order).days
        if row.last_order else None
    )

    relationship_days = (
        (datetime.utcnow() - row.first_order).days
        if row.first_order else 1
    )

    frequency = total_orders / relationship_days

    return {
        "customer_id": row.customer_id,
        "customer_name": row.customer_name,
        "customer_email": row.customer_email,
        "total_orders": total_orders,
        "total_spent": round(total_spent, 2),
        "avg_ticket": round(avg_ticket, 2),
        "days_since_last_order": days_since_last_order,
        "frequency": round(frequency, 4)
    }

def get_customers_metrics_paginated(page=1, per_page=20):
    query = db.session.query(
        Customer.id.label("customer_id"),
        Customer.name.label("customer_name"),
        Customer.email.label("customer_email"),
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_amount).label("total_spent"),
        func.max(Order.created_at).label("last_order"),
        func.min(Order.created_at).label("first_order")
    ).outerjoin(Order, Customer.id == Order.customer_id).group_by(Customer.id)

    results = (
        query
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    customers = []

    for row in results:
        total_orders = row.total_orders or 0
        total_spent = float(row.total_spent or 0)

        avg_ticket = (
            total_spent / total_orders
            if total_orders > 0 else 0
        )

        days_since_last_order = (
            (datetime.utcnow() - row.last_order).days
            if row.last_order else None
        )

        relationship_days = (
            (datetime.utcnow() - row.first_order).days
            if row.first_order else 1
        )

        frequency = (
            total_orders / max(relationship_days / 30, 1)
        )

        customers.append({
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "customer_email": row.customer_email,
            "total_orders": total_orders,
            "total_spent": total_spent,
            "avg_ticket": round(avg_ticket, 2),
            "days_since_last_order": days_since_last_order,
            "frequency": round(frequency, 2)
        })

    return customers, len(customers)

def _empty_metrics():
    return {
        "total_orders": 0,
        "total_spent": 0,
        "avg_ticket": 0,
        "days_since_last_order": None
    }

def extract_dataset():

    results = db.session.query(
        Order.customer_id.label("customer_id"),
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_amount).label("total_spent"),
        func.min(Order.created_at).label("first_order"),
        func.max(Order.created_at).label("last_order"),
    ).outerjoin(Customer, Customer.id == Order.customer_id
    ).group_by(Order.customer_id).all()

    dataset = []

    for row in results:
        total_orders = row.total_orders
        total_spent = float(row.total_spent or 0)
        avg_ticket = total_spent / total_orders if total_orders > 0 else 0

        days_since_last_order = (datetime.utcnow() - row.last_order).days

        if row.first_order:
            months_active = max(
                (datetime.utcnow() - row.first_order).days / 30,
                1
            )

            frequency = total_orders / months_active
        else:
            frequency = 0

        dataset.append({
            "customer_id": str(row.customer_id),
            "total_orders": total_orders,
            "total_spent": round(total_spent, 2),
            "avg_ticket": round(avg_ticket, 2),
            "days_since_last_order": days_since_last_order,
            "frequency": round(frequency, 2),
        })

    return dataset, len(dataset)