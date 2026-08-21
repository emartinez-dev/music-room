import pytest


@pytest.fixture(autouse=True)
def _use_locmem_email_backend(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
