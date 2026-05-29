"""Churn HTTP endpoints. Reads -> selectors, writes -> services."""
from uuid import UUID

from ninja import Router

from common.schemas import Message

from . import selectors, services
from .schemas import PredictRequest, PredictResponse, TrainingRunOut, TrainRequest

router = Router(tags=["churn"])


@router.post("/train", response={202: TrainingRunOut})
def start_training(request, payload: TrainRequest):
    run = services.start_training_run(
        dataset_ref=payload.dataset_ref,
        hyperparameters=payload.hyperparameters,
    )
    return 202, run


@router.get("/runs", response=list[TrainingRunOut])
def list_runs(request):
    return list(selectors.list_training_runs())


@router.get("/runs/{run_id}", response={200: TrainingRunOut, 404: Message})
def get_run(request, run_id: UUID):
    run = selectors.get_training_run(run_id)
    if run is None:
        return 404, Message(detail="Training run not found")
    return 200, run


@router.post("/predict", response=PredictResponse)
def predict(request, payload: PredictRequest):
    return services.predict_churn(client_ref=payload.client_ref, features=payload.features)
