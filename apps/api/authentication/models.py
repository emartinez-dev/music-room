import random
import secrets

from django.db import models
from django.utils import timezone


def generate_six_digit_token():
    # Kept for migration 0003, which references this function by import path.
    # UNUSED - do not remove without collapsing that migration.
    return f"{random.randint(0, 999999):06d}"


def generate_verification_token():
    return secrets.token_urlsafe(32)


class BlacklistedRefreshToken(models.Model):
    refresh_token = models.TextField(unique=True)
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return self.refresh_token[:20]


class BaseSingleUseToken(models.Model):
    token = models.CharField(
        max_length=64,
        default=generate_verification_token,
        unique=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        abstract = True


class EmailVerificationToken(BaseSingleUseToken):
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )

    def __str__(self):
        return f"Verification for {self.user.email} ({'used' if self.used else 'unused'})"


class PasswordResetToken(BaseSingleUseToken):
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )

    def __str__(self):
        return f"Password reset for {self.user.email} ({'used' if self.used else 'unused'})"


class PasswordChangeLog(models.Model):
    user = models.OneToOneField(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="password_change_log",
    )
    changed_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Password change for {self.user.email} at {self.changed_at}"
