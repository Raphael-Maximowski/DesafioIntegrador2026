"""Model loading and inference for churn prediction.

TODO (training owner): implement load_model() and predict().
"""
from typing import Any


def load_model(artifact_path: str):
    """Load a persisted model from disk (e.g. joblib.load)."""
    raise NotImplementedError


def predict(model, features: dict[str, Any]) -> float:
    """Return the churn probability for a single client's features."""
    raise NotImplementedError
