"""Match serializers."""

from rest_framework import serializers
from players.serializers import PlayerSerializer
from .models import Match


class MatchSerializer(serializers.ModelSerializer):
    """Full read serializer for Match with nested player names."""

    player_white_detail = PlayerSerializer(source="player_white", read_only=True)
    player_black_detail = PlayerSerializer(source="player_black", read_only=True)
    winner_detail = PlayerSerializer(source="winner", read_only=True)
    is_bye = serializers.BooleanField(read_only=True)

    class Meta:
        model = Match
        fields = [
            "id",
            "tournament",
            "round_number",
            "player_white",
            "player_white_detail",
            "player_black",
            "player_black_detail",
            "result",
            "winner",
            "winner_detail",
            "is_bye",
            "played_at",
        ]
        read_only_fields = [
            "id",
            "tournament",
            "player_white",
            "player_black",
            "winner",
            "result",
            "is_bye",
            "played_at",
        ]


class MatchUpdateSerializer(serializers.ModelSerializer):
    """Restricted serializer — only round_number is editable via API."""

    class Meta:
        model = Match
        fields = ["id", "round_number"]
