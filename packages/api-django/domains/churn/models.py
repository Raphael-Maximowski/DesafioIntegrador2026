import uuid

from django.db import models

from common.models import TimeStampedModel


class TrainingRun(TimeStampedModel):
    """A single churn-model training job and its results."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    algorithm = models.CharField(max_length=50, default="random_forest")

    hyperparameters = models.JSONField(default=dict, blank=True)
    dataset_ref = models.CharField(max_length=255, blank=True, default="")

    metrics = models.JSONField(default=dict, blank=True)
    feature_importances = models.JSONField(default=dict, blank=True)
    artifact_path = models.CharField(max_length=512, blank=True, default="")
    error_message = models.TextField(blank=True, default="")

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"TrainingRun {self.id} ({self.status})"


class ChurnPrediction(TimeStampedModel):
    """Optional log of served predictions, for auditing / monitoring."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    training_run = models.ForeignKey(
        TrainingRun,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="predictions",
    )
    client_ref = models.CharField(max_length=255, blank=True, default="")
    features = models.JSONField(default=dict, blank=True)
    churn_probability = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
