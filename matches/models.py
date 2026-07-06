"""Match model — one game between two players in a tournament round."""

from django.db import models
from players.models import Player
from tournaments.models import Tournament


class Match(models.Model):
    """Represents a single chess game within a tournament round."""

    class Result(models.TextChoices):
        WHITE_WIN = "white_win", "White Wins"
        BLACK_WIN = "black_win", "Black Wins"
        DRAW = "draw", "Draw"
        PENDING = "pending", "Pending"

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="matches",
    )
    player_white = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name="matches_as_white",
    )
    # Nullable for a "bye" — player_white wins automatically
    player_black = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        related_name="matches_as_black",
        null=True,
        blank=True,
    )
    winner = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        related_name="matches_won",
        null=True,
        blank=True,
    )
    result = models.CharField(
        max_length=20,
        choices=Result.choices,
        default=Result.PENDING,
    )
    round_number = models.PositiveIntegerField()
    played_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["tournament", "round_number", "id"]
        verbose_name = "Match"
        verbose_name_plural = "Matches"

    def __str__(self):
        black_name = self.player_black.name if self.player_black else "BYE"
        return (
            f"[R{self.round_number}] {self.player_white.name} vs {black_name}"
            f" — {self.result} ({self.tournament.name})"
        )

    @property
    def is_bye(self):
        return self.player_black is None
