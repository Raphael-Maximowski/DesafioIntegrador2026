"""Read-side logic for the churn domain (queries only)."""
from uuid import UUID

from django.db.models import QuerySet

from .models import TrainingRun


def list_training_runs() -> QuerySet[TrainingRun]:
    return TrainingRun.objects.all()


def get_training_run(run_id: UUID) -> TrainingRun | None:
    return TrainingRun.objects.filter(id=run_id).first()
