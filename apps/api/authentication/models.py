import random

from django.db import models


def generate_six_digit_token():
    return f"{random.randint(0, 999999):06d}"


class BlacklistedRefreshToken(models.Model):
    refresh_token = models.TextField(unique=True)
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return self.refresh_token[:20]


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )
    token = models.CharField(
        max_length=6,
        default=generate_six_digit_token,
        unique=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def __str__(self):
        return f"Verification for {self.user.email} ({'used' if self.used else 'unused'})"
