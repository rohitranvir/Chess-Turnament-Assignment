"""Serializers for Tournament and TournamentPlayer."""

from rest_framework import serializers
from players.serializers import PlayerSerializer
from .models import Tournament, TournamentPlayer


class TournamentPlayerSerializer(serializers.ModelSerializer):
    """Serializer for TournamentPlayer through model — used in nested listings."""

    player = PlayerSerializer(read_only=True)

    class Meta:
        model = TournamentPlayer
        fields = ["id", "player", "points", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class TournamentSerializer(serializers.ModelSerializer):
    """
    Full serializer for Tournament with:
    - read-only player_count summary
    - validation that end_date > start_date
    """

    player_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tournament
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "status",
            "player_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "player_count"]

    # ------------------------------------------------------------------
    # Computed field
    # ------------------------------------------------------------------

    def get_player_count(self, obj):
        return obj.players.count()

    # ------------------------------------------------------------------
    # Field-level validation
    # ------------------------------------------------------------------

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Tournament name cannot be blank.")
        return value

    # ------------------------------------------------------------------
    # Object-level validation
    # ------------------------------------------------------------------

    def validate(self, attrs):
        """Ensure end_date is strictly after start_date, and prevent editing completed tournaments."""
        if self.instance and self.instance.status == Tournament.Status.COMPLETED:
            # Only allow status change from completed if they're reverting it (rare), 
            # otherwise block edits on completed tournaments.
            if attrs.get("status") not in (None, Tournament.Status.COMPLETED):
                pass # Allow reverting status
            else:
                raise serializers.ValidationError("Cannot edit a completed tournament.")

        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)

        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_date": "end_date must be strictly after start_date."}
            )
        return attrs


class AddPlayerSerializer(serializers.Serializer):
    """Payload for adding a player to a tournament."""

    player_id = serializers.IntegerField(
        help_text="Primary key of the Player to add."
    )
    points = serializers.DecimalField(
        max_digits=6,
        decimal_places=1,
        default=0,
        required=False,
        help_text="Initial points (default 0).",
    )

    def validate_player_id(self, value):
        from players.models import Player

        if not Player.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"Player with id={value} does not exist.")
        return value


class RemovePlayerSerializer(serializers.Serializer):
    """Payload for removing a player from a tournament."""

    player_id = serializers.IntegerField(
        help_text="Primary key of the Player to remove."
    )
