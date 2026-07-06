"""Custom User model extending AbstractUser with role field."""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model.

    Roles
    -----
    admin  — full read/write access to all API endpoints
    viewer — read-only (GET) access to all API endpoints
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        VIEWER = "viewer", "Viewer"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
        help_text="Determines API access level: admin (full) or viewer (read-only).",
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.Role.ADMIN

    @property
    def is_viewer_role(self) -> bool:
        return self.role == self.Role.VIEWER
