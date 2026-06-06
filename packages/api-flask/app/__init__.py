from flask import Flask
from app.config import Config
from app.models import *
from app.extensions import db, migrate
from flask_cors import CORS
from flask_smorest import Api
from app.routes.analytics import blp as analytics_bp
from app.routes.train import blp as train_bp

def create_app():
    app = Flask(__name__)

    app.config["API_TITLE"] = "API de Análise de Vendas"
    app.config["API_VERSION"] = "1.0"
    app.config["OPENAPI_VERSION"] = "3.0.2"
    app.config["API_DESCRIPTION"] = "API para análise de vendas e previsão de churn"

    app.config["OPENAPI_URL_PREFIX"] = "/"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/docs"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

    api = Api(app)

    app.config.from_object(Config)
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    migrate.init_app(app, db)
    api.register_blueprint(analytics_bp)
    api.register_blueprint(train_bp)
    return app