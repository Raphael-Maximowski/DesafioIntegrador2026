from flask_smorest import Blueprint
from app.services.analytics_service import get_customer_metrics, get_all_customers_metrics
from flask import request
from app.schemas.analytics_schema import CustomerAnalyticsSchema, PaginatedCustomerAnalyticsSchema
from app.schemas.health_schema import HealthCheckSchema

blp = Blueprint("analytics", __name__, description="Analytics de clientes", url_prefix="/analytics")

@blp.get("/health")
@blp.response(200, HealthCheckSchema)
def health_check():
    return {
        "status": "success",
        "message": "Analytics de vendas funcionando"
    }


@blp.get("/customers/<customer_id>/metrics")
@blp.response(200, CustomerAnalyticsSchema)
def customer_metrics(customer_id):
    return get_customer_metrics(customer_id)

@blp.get("/customers/metrics")
@blp.response(200, PaginatedCustomerAnalyticsSchema)
def all_customers_metrics():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    return get_all_customers_metrics(page, per_page)