from datetime import datetime
from typing import Any
from uuid import UUID

from ninja import Schema


class TrainRequest(Schema):
    dataset_ref: str = ""
    hyperparameters: dict[str, Any] = {}


class TrainingRunOut(Schema):
    id: UUID
    status: str
    algorithm: str
    hyperparameters: dict[str, Any]
    dataset_ref: str
    metrics: dict[str, Any]
    feature_importances: dict[str, Any]
    error_message: str
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None


class PredictRequest(Schema):
    client_ref: str = ""
    features: dict[str, Any]


class PredictResponse(Schema):
    client_ref: str
    churn_probability: float
    churn_label: bool
    training_run_id: UUID | None = None
