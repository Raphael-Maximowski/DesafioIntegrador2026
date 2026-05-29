from ninja import Schema


class Message(Schema):
    """Generic message / error payload."""

    detail: str
