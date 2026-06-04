from flask import Flask
from app.config import Config
from app.routes.analytics import analytics_bp
from app.models import *
from app.extensions import db, migrate
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    print("DATABASE_URI:", app.config.get("SQLALCHEMY_DATABASE_URI"))
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    migrate.init_app(app, db)
    app.register_blueprint(analytics_bp)
    return app