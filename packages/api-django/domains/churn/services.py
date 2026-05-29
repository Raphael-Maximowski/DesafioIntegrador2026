"""Write-side / orchestration logic for the churn domain.

The dispatch wiring lives here; model logic lives in ml/ and is left
unimplemented for the training owner.
"""
from typing import Any

from .models import TrainingRun
from .tasks import train_churn_model


def start_training_run(*, dataset_ref: str, hyperparameters: dict[str, Any]) -> TrainingRun:
    run = TrainingRun.objects.create(
        dataset_ref=dataset_ref,
        hyperparameters=hyperparameters,
        status=TrainingRun.Status.PENDING,
    )
    train_churn_model.delay(str(run.id))
    run.refresh_from_db()
    return run


def predict_churn(*, client_ref: str, features: dict[str, Any]):
    """TODO (training owner): load the active model via ml/predictor and score."""
    raise NotImplementedError("Inference not implemented yet. See domains/churn/ml/predictor.py.")
