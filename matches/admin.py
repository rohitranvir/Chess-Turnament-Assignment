"""Admin registration for Match model."""

from django.contrib import admin
from .models import Match


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tournament",
        "round_number",
        "player_white",
        "player_black",
        "result",
        "winner",
        "played_at",
    )
    list_filter = ("tournament", "round_number", "result")
    search_fields = (
        "tournament__name",
        "player_white__name",
        "player_black__name",
        "winner__name",
    )
    ordering = ("tournament", "round_number", "id")
    readonly_fields = ("played_at",)
    fieldsets = (
        ("Match Info", {"fields": ("tournament", "round_number")}),
        ("Players", {"fields": ("player_white", "player_black")}),
        ("Result", {"fields": ("result", "winner", "played_at")}),
    )
