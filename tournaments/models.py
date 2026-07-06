"""Tournament and TournamentPlayer models."""

from django.db import models
from players.models import Player


class Tournament(models.Model):
    """Represents a chess tournament event."""

    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Upcoming"
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"

    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPCOMING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # Many-to-many to Player through TournamentPlayer
    players = models.ManyToManyField(
        Player,
        through="TournamentPlayer",
        related_name="tournaments",
        blank=True,
    )

    class Meta:
        ordering = ["-start_date", "name"]
        verbose_name = "Tournament"
        verbose_name_plural = "Tournaments"

    def __str__(self):
        return f"{self.name} [{self.status}] ({self.start_date} → {self.end_date})"


class TournamentPlayer(models.Model):
    """Through model linking Tournament ↔ Player with points."""

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="tournament_players",
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="tournament_entries",
    )
    points = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        default=0,
        help_text="Points earned by this player in the tournament",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("tournament", "player")
        ordering = ["-points", "player__name"]
        verbose_name = "Tournament Player"
        verbose_name_plural = "Tournament Players"

    def __str__(self):
        return f"{self.player.name} in {self.tournament.name} — {self.points} pts"
