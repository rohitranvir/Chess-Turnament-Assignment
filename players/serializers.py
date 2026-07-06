"""Player serializer with full field validation."""

from rest_framework import serializers
from .models import Player


class PlayerSerializer(serializers.ModelSerializer):
    """Serializes Player model with custom validation."""

    class Meta:
        model = Player
        fields = [
            "id",
            "name",
            "email",
            "rating",
            "country",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # ------------------------------------------------------------------
    # Field-level validation
    # ------------------------------------------------------------------

    def validate_name(self, value):
        """Ensure name is not blank or whitespace-only."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name is required and cannot be blank.")
        return value

    def validate_email(self, value):
        """Normalize and validate email format (DRF EmailField handles format)."""
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("A valid email address is required.")
        return value

    def validate_rating(self, value):
        """Ensure rating is a non-negative integer."""
        if value < 0:
            raise serializers.ValidationError(
                "Rating must be a non-negative integer (>= 0)."
            )
        return value

    def validate_country(self, value):
        """Strip whitespace from country field."""
        return value.strip()

    # ------------------------------------------------------------------
    # Object-level validation
    # ------------------------------------------------------------------

    def validate(self, attrs):
        """Cross-field validation — extend here as needed."""
        return attrs
