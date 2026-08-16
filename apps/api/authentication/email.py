import datetime

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from authentication.models import EmailVerificationToken


def send_verification_email(user):
    """Generates a verification token and sends an email to the user"""

    expires_at = timezone.now() + datetime.timedelta(hours=24)
    token_obj = EmailVerificationToken.objects.create(user=user, expires_at=expires_at)

    verify_url = f"{settings.FRONTEND_URL}/verify-email/{token_obj.token}/"

    send_mail(
        subject="Verify your email for Music Room",
        message=(
            f"Hello {user.username}!\n\n"
            f"Your verification code is:\n\n"
            f"{token_obj.token}\n\n"
            f"Or click the following link:\n"
            f"{verify_url}\n\n"
            f"This code will expire in 24 hours."
        ),
        from_email=f"Music Room <{settings.EMAIL_HOST_USER}>",
        recipient_list=[user.email],
        fail_silently=False,
    )

    return token_obj
