"""Admin registration for Tournament and TournamentPlayer models."""

from django.contrib import admin
from .models import Tournament, TournamentPlayer


class TournamentPlayerInline(admin.TabularInline):
    """Inline editor for players inside a Tournament admin page."""

    model = TournamentPlayer
    extra = 1
    readonly_fields = ("joined_at",)
    autocomplete_fields = ("player",)


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "start_date", "end_date", "player_count", "created_at")
    list_filter = ("status",)
    search_fields = ("name",)
    ordering = ("-start_date", "name")
    readonly_fields = ("created_at",)
    inlines = [TournamentPlayerInline]
    fieldsets = (
        ("Tournament Info", {"fields": ("name", "status")}),
        ("Schedule", {"fields": ("start_date", "end_date")}),
        ("Metadata", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    @admin.display(description="# Players")
    def player_count(self, obj):
        return obj.players.count()


@admin.register(TournamentPlayer)
class TournamentPlayerAdmin(admin.ModelAdmin):
    list_display = ("tournament", "player", "points", "joined_at")
    list_filter = ("tournament",)
    search_fields = ("tournament__name", "player__name", "player__email")
    ordering = ("tournament", "-points")
    readonly_fields = ("joined_at",)
