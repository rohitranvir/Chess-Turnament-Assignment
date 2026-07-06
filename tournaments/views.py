"""Tournament views — full CRUD + custom player-management actions."""

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from players.models import Player
from .models import Tournament, TournamentPlayer
from .serializers import (
    TournamentSerializer,
    TournamentPlayerSerializer,
    AddPlayerSerializer,
    RemovePlayerSerializer,
)


class TournamentViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tournament plus three custom actions:

      POST   /api/tournaments/{id}/add_player/    — add a player by ID
      POST   /api/tournaments/{id}/remove_player/ — remove a player by ID
      GET    /api/tournaments/{id}/players/       — list players with points
    """

    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer

    # ------------------------------------------------------------------
    # Custom action: add_player
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="add_player")
    def add_player(self, request, pk=None):
        """
        POST /api/tournaments/{id}/add_player/
        Body: { "player_id": <int>, "points": <decimal, optional> }
        """
        tournament = self.get_object()

        # Reject additions to a completed tournament
        if tournament.status == Tournament.Status.COMPLETED:
            return Response(
                {"error": "Cannot add players to a completed tournament."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AddPlayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        player_id = serializer.validated_data["player_id"]
        points = serializer.validated_data.get("points", 0)
        player = get_object_or_404(Player, pk=player_id)

        # Reject duplicate registrations
        if TournamentPlayer.objects.filter(tournament=tournament, player=player).exists():
            return Response(
                {
                    "error": (
                        f"Player '{player.name}' is already registered "
                        f"in '{tournament.name}'."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        tp = TournamentPlayer.objects.create(
            tournament=tournament, player=player, points=points
        )
        return Response(
            {
                "message": (
                    f"Player '{player.name}' successfully added to '{tournament.name}'."
                ),
                "data": TournamentPlayerSerializer(tp).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------
    # Custom action: remove_player
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="remove_player")
    def remove_player(self, request, pk=None):
        """
        POST /api/tournaments/{id}/remove_player/
        Body: { "player_id": <int> }
        """
        tournament = self.get_object()

        serializer = RemovePlayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        player_id = serializer.validated_data["player_id"]
        player = get_object_or_404(Player, pk=player_id)

        tp = TournamentPlayer.objects.filter(
            tournament=tournament, player=player
        ).first()

        if not tp:
            return Response(
                {
                    "error": (
                        f"Player '{player.name}' is not registered "
                        f"in '{tournament.name}'."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        tp.delete()
        return Response(
            {
                "message": (
                    f"Player '{player.name}' removed from '{tournament.name}'."
                )
            },
            status=status.HTTP_200_OK,
        )

    # ------------------------------------------------------------------
    # Custom action: players (list)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get"], url_path="players")
    def players(self, request, pk=None):
        """
        GET /api/tournaments/{id}/players/
        Returns all players in this tournament with their points.
        """
        tournament = self.get_object()
        entries = TournamentPlayer.objects.filter(
            tournament=tournament
        ).select_related("player").order_by("-points", "player__name")

        serializer = TournamentPlayerSerializer(entries, many=True)
        return Response(
            {
                "tournament": tournament.name,
                "status": tournament.status,
                "player_count": entries.count(),
                "players": serializer.data,
            }
        )
