class UserConflictError(Exception):
    """Raised when trying to create a user with credentials that already exist."""


class WeakPasswordError(Exception):
    """Raised when a password fails Django's configured password validators."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
