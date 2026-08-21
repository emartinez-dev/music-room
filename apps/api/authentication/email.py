import datetime

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from authentication.models import EmailVerificationToken


def send_verification_email(user):
    """Generates a verification token and sends an email to the user"""

    EmailVerificationToken.objects.filter(user=user, used=False).delete()

    expires_at = timezone.now() + datetime.timedelta(hours=2)
    token_obj = EmailVerificationToken.objects.create(user=user, expires_at=expires_at)

    verify_url = f"{settings.EMAIL_VERIFY_URL}/verify-email?token={token_obj.token}"

    send_mail(
        subject="Verify your email for Music Room",
        message=(
            f"Hello {user.username}!\n\n"
            f"Open this link on your phone to verify your email:\n\n"
            f"{verify_url}\n\n"
            f"This link will expire in 2 hours."
        ),
        from_email=f"Music Room <{settings.EMAIL_HOST_USER}>",
        recipient_list=[user.email],
        fail_silently=False,
        html_message=(
            f"<p>Hello {user.username}!</p>"
            f'<p><a href="{verify_url}">Tap here to verify your email</a></p>'
            f"<p>This link will expire in 2 hours.</p>"
        ),
    )

    return token_obj


def send_password_reset_email(user):
    """Generates a verification token and sends a password reset email to the user"""

    EmailVerificationToken.objects.filter(user=user, used=False).delete()

    expires_at = timezone.now() + datetime.timedelta(hours=2)
    token_obj = EmailVerificationToken.objects.create(user=user, expires_at=expires_at)

    reset_url = f"{settings.EMAIL_VERIFY_URL}/reset-password?token={token_obj.token}&email={user.email}"

    send_mail(
        subject="Reset your password for Music Room",
        message=(
            f"Hello {user.username}!\n\n"
            f"Open this link on your phone to reset your password:\n\n"
            f"{reset_url}\n\n"
            f"This link will expire in 2 hours."
        ),
        from_email=f"Music Room <{settings.EMAIL_HOST_USER}>",
        recipient_list=[user.email],
        fail_silently=False,
        html_message=(
            f"<p>Hello {user.username}!</p>"
            f'<p><a href="{reset_url}">Tap here to reset your password</a></p>'
            f"<p>This link will expire in 2 hours.</p>"
        ),
    )

    return token_obj
