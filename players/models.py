"""Player model definition."""

from django.db import models
from django.core.validators import MinValueValidator


class Player(models.Model):
    """Represents a chess player registered in the tournament system."""

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    rating = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="ELO rating (non-negative integer)",
    )
    country = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-rating", "name"]
        verbose_name = "Player"
        verbose_name_plural = "Players"

    def __str__(self):
        return f"{self.name} ({self.email}) — Rating: {self.rating}"
