"""Accounts HTTP endpoints (placeholder for the auth domain)."""
from ninja import Router

from common.schemas import Message

router = Router(tags=["accounts"])


@router.get("/me", response={200: Message})
def me(request):
    return 200, Message(detail="accounts domain placeholder")
