import pytest

from domains.churn.models import TrainingRun
from domains.churn import selectors


@pytest.mark.django_db
def test_get_training_run_returns_none_when_missing():
    import uuid

    assert selectors.get_training_run(uuid.uuid4()) is None


@pytest.mark.django_db
def test_list_training_runs_orders_newest_first():
    a = TrainingRun.objects.create()
    b = TrainingRun.objects.create()
    runs = list(selectors.list_training_runs())
    assert runs[0] == b
    assert runs[1] == a
