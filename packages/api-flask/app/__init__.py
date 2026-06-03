from flask import Flask
from app.config import Config
from app.extensions import db, migrate
from app.routes.analytics import analytics_bp
import app.models

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)
    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(analytics_bp)

    @app.get("/")
    def home():
        return {"message": "API Flask rodando"}

    return app