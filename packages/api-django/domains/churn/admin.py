from django.contrib import admin

from .models import ChurnPrediction, TrainingRun


@admin.register(TrainingRun)
class TrainingRunAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "algorithm", "created_at", "finished_at")
    list_filter = ("status", "algorithm")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ChurnPrediction)
class ChurnPredictionAdmin(admin.ModelAdmin):
    list_display = ("id", "client_ref", "churn_probability", "created_at")
