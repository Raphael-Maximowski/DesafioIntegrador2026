"""Project-wide exception types used by the service layer."""


class ApplicationError(Exception):
    """Base class for expected, user-facing domain errors."""

    def __init__(self, message: str, *, code: str | None = None):
        super().__init__(message)
        self.message = message
        self.code = code
