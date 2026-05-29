"""Celery tasks for long-running churn jobs."""
from celery import shared_task


@shared_task
def train_churn_model(run_id: str) -> str:
    """Run a churn training job end-to-end.

    TODO (training owner):
      1. Load the TrainingRun; set status RUNNING + started_at.
      2. Build features  -> ml/features.py
      3. Train the model -> ml/trainer.py
      4. Persist metrics, feature_importances, artifact_path.
      5. Set status SUCCESS + finished_at (or FAILED + error_message).
    """
    raise NotImplementedError("Training task not implemented. See domains/churn/ml/trainer.py.")
