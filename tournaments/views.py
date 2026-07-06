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
# matches services imported lazily inside actions to avoid circular imports


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

    # ------------------------------------------------------------------
    # Custom action: generate_matches
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="generate_matches")
    def generate_matches(self, request, pk=None):
        """
        POST /api/tournaments/{id}/generate_matches/
        Body: { "round_number": <int> }

        Shuffles enrolled players and creates paired Match records for
        the given round. Odd count → last player receives a BYE (+3 pts).
        """
        from matches.services import generate_random_matches
        from matches.serializers import MatchSerializer

        tournament = self.get_object()

        round_number = request.data.get("round_number")
        if round_number is None:
            return Response(
                {"error": "'round_number' is required in the request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            round_number = int(round_number)
            if round_number < 1:
                raise ValueError
        except (ValueError, TypeError):
            return Response(
                {"error": "'round_number' must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            matches = generate_random_matches(tournament.pk, round_number)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        bye_count = sum(1 for m in matches if m.is_bye)
        return Response(
            {
                "message": (
                    f"Generated {len(matches)} match(es) for round {round_number} "
                    f"in '{tournament.name}' ({bye_count} bye(s))."
                ),
                "round_number": round_number,
                "match_count": len(matches),
                "bye_count": bye_count,
                "matches": MatchSerializer(matches, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ------------------------------------------------------------------
    # Custom action: simulate_round
    # ------------------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path=r"simulate_round/(?P<round_number>[0-9]+)",
    )
    def simulate_round(self, request, pk=None, round_number=None):
        """
        POST /api/tournaments/{id}/simulate_round/{round_number}/

        Simulates ALL pending (non-bye) matches in the given round.
        Skips already-decided matches silently.
        """
        from matches.models import Match
        from matches.serializers import MatchSerializer
        from matches.services import simulate_match_result

        tournament = self.get_object()
        round_number = int(round_number)

        pending_matches = Match.objects.filter(
            tournament=tournament,
            round_number=round_number,
            result=Match.Result.PENDING,
            player_black__isnull=False,   # exclude byes
        )

        if not pending_matches.exists():
            return Response(
                {
                    "message": (
                        f"No pending matches found for round {round_number} "
                        f"in '{tournament.name}'."
                    )
                },
                status=status.HTTP_200_OK,
            )

        simulated = []
        errors = []
        for match in pending_matches:
            try:
                updated = simulate_match_result(match.pk)
                simulated.append(updated)
            except (ValueError, RuntimeError) as exc:
                errors.append({"match_id": match.pk, "error": str(exc)})

        return Response(
            {
                "message": (
                    f"Simulated {len(simulated)} match(es) in round {round_number} "
                    f"of '{tournament.name}'."
                ),
                "simulated_count": len(simulated),
                "errors": errors,
                "matches": MatchSerializer(simulated, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
