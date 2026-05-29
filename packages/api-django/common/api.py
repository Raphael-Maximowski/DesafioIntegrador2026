from datetime import datetime, timezone

from ninja import Router, Schema

router = Router(tags=["health"])


class HealthOut(Schema):
    status: str
    service: str
    timestamp: str


@router.get("", response=HealthOut)
def health(request):
    return HealthOut(
        status="ok",
        service="api-django",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
