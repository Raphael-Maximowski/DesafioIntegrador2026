from flask import Flask
from app.config import Config

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    @app.get("/")
    def home():
        return {"message": "API Flask rodando"}

    return app