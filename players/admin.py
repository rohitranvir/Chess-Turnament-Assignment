"""Admin registration for Player model."""

from django.contrib import admin
from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "rating", "country", "created_at", "updated_at")
    list_filter = ("country",)
    search_fields = ("name", "email", "country")
    ordering = ("-rating", "name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Basic Info", {"fields": ("name", "email", "country")}),
        ("Chess Info", {"fields": ("rating",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
