from flask_smorest import Blueprint
from app.services.ml_service import train_models

blp = Blueprint("train", __name__, description="Treinamento de modelos de machine learning", url_prefix="/train")

@blp.post("/model")
@blp.response(200, description="Modelo treinado com sucesso")
def train_model_route():
    try:
        result = train_models()

        return {
            "status": "success",
            "message": "Modelos treinados com sucesso",
            "metrics": result
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro ao treinar modelo: {str(e)}"
        }, 500