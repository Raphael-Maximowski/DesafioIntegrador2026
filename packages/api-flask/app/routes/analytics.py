from flask import Blueprint

analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")


@analytics_bp.get("/health")
def health_check():
    return {
        "status": "success", 
        "message": "Analytics de vendas funcionando"
    }