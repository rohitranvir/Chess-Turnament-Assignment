"""Admin configuration for the custom User model."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Custom admin extending Django's built-in UserAdmin to show the role field."""

    list_display = ("username", "email", "role", "is_staff", "is_active", "date_joined")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email")
    ordering = ("username",)

    # Add role to the existing fieldsets
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Role & Permissions", {"fields": ("role",)}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Role", {"fields": ("role",)}),
    )
