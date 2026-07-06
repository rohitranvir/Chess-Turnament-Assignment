"""Tournament views — full CRUD + custom player-management actions."""

from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAuthenticatedReadOnly
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
    permission_classes = [IsAuthenticatedReadOnly]

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
            raise serializers.ValidationError("Cannot add players to a completed tournament.")

        serializer = AddPlayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        player_id = serializer.validated_data["player_id"]
        points = serializer.validated_data.get("points", 0)
        player = get_object_or_404(Player, pk=player_id)

        # Reject duplicate registrations
        if TournamentPlayer.objects.filter(tournament=tournament, player=player).exists():
            raise serializers.ValidationError(
                f"Player '{player.name}' is already registered in '{tournament.name}'."
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

        if tournament.status == Tournament.Status.COMPLETED:
            raise serializers.ValidationError("Cannot remove players from a completed tournament.")

        serializer = RemovePlayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        player_id = serializer.validated_data["player_id"]
        player = get_object_or_404(Player, pk=player_id)

        tp = TournamentPlayer.objects.filter(
            tournament=tournament, player=player
        ).first()

        if not tp:
            from rest_framework.exceptions import NotFound
            raise NotFound(
                f"Player '{player.name}' is not registered in '{tournament.name}'."
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
            raise serializers.ValidationError("'round_number' is required in the request body.")
        try:
            round_number = int(round_number)
            if round_number < 1:
                raise ValueError
        except (ValueError, TypeError):
            raise serializers.ValidationError("'round_number' must be a positive integer.")

        try:
            matches = generate_random_matches(tournament.pk, round_number)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))

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

    # ------------------------------------------------------------------
    # Custom action: rankings
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get"], url_path="rankings")
    def rankings(self, request, pk=None):
        """
        GET /api/tournaments/{id}/rankings/

        Returns all enrolled players sorted by:
          1. points (descending)
          2. wins in this tournament (descending, tie-breaker)

        Ranking style: competition ranking (standard / "1224" style).
          - Tied players share the same rank.
          - The next rank skips accordingly (e.g., two 2nd-place → next is 4th).

        Position labels: 1st 🥇 / 2nd 🥈 / 3rd 🥉 / 4th / 5th / …

        Edge cases handled:
          - Fewer than 3 players  → labels only as far as there are players.
          - No matches played yet → wins = 0 for all; points = 0 for all;
                                    returns ranked list with a note.
          - Tied scores at cutoff → all tied players share the same rank label.
        """
        from matches.models import Match
        from django.db.models import Count, Q

        tournament = self.get_object()

        # ── 1. Fetch all enrolled players ──────────────────────────────
        entries = list(
            TournamentPlayer.objects.filter(tournament=tournament)
            .select_related("player")
        )

        if not entries:
            return Response(
                {
                    "tournament": tournament.name,
                    "status": tournament.status,
                    "total_players": 0,
                    "matches_played": 0,
                    "note": "No players are enrolled in this tournament yet.",
                    "rankings": [],
                },
                status=status.HTTP_200_OK,
            )

        # ── 2. Count wins per player in this tournament ─────────────────
        wins_qs = (
            Match.objects.filter(tournament=tournament, winner__isnull=False)
            .values("winner_id")
            .annotate(win_count=Count("id"))
        )
        wins_map = {row["winner_id"]: row["win_count"] for row in wins_qs}

        # ── 3. Count total decided matches (for context) ────────────────
        matches_played = Match.objects.filter(
            tournament=tournament
        ).exclude(result=Match.Result.PENDING).count()

        # ── 4. Sort: points DESC, then wins DESC ────────────────────────
        entries.sort(
            key=lambda e: (
                -float(e.points),
                -wins_map.get(e.player_id, 0),
            )
        )

        # ── 5. Assign competition-style ranks ───────────────────────────
        ORDINAL_LABELS = {
            1: "1st 🥇",
            2: "2nd 🥈",
            3: "3rd 🥉",
        }

        def _ordinal(n: int) -> str:
            if n in ORDINAL_LABELS:
                return ORDINAL_LABELS[n]
            suffix = (
                "th" if 11 <= (n % 100) <= 13
                else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
            )
            return f"{n}{suffix}"

        ranked = []
        current_rank = 0       # rank assigned to the current group
        next_rank = 1          # next rank to allocate (skips for ties)

        for i, entry in enumerate(entries):
            wins = wins_map.get(entry.player_id, 0)

            if i == 0:
                # First player always gets rank 1
                current_rank = 1
                next_rank = 2
            else:
                prev = entries[i - 1]
                prev_wins = wins_map.get(prev.player_id, 0)
                tied = (
                    float(entry.points) == float(prev.points)
                    and wins == prev_wins
                )
                if tied:
                    # Same rank as previous player — next_rank still advances
                    next_rank += 1
                else:
                    # New rank = next_rank
                    current_rank = next_rank
                    next_rank = current_rank + 1

            ranked.append(
                {
                    "rank": current_rank,
                    "position_label": _ordinal(current_rank),
                    "player_id": entry.player.id,
                    "player_name": entry.player.name,
                    "player_email": entry.player.email,
                    "player_rating": entry.player.rating,
                    "country": entry.player.country,
                    "points": float(entry.points),
                    "wins": wins,
                    "joined_at": entry.joined_at,
                }
            )

        # ── 6. Build summary note ───────────────────────────────────────
        notes = []
        if matches_played == 0:
            notes.append(
                "No matches have been played yet — all points and wins are 0."
            )

        # Detect top-3 ties that span across podium positions
        podium = [r for r in ranked if r["rank"] <= 3]
        if len(podium) > 3:
            notes.append(
                f"{len(podium)} players share a podium position due to tied "
                "scores and wins — all are shown with the same rank."
            )

        return Response(
            {
                "tournament": tournament.name,
                "status": tournament.status,
                "total_players": len(ranked),
                "matches_played": matches_played,
                **({"notes": notes} if notes else {}),
                "rankings": ranked,
            },
            status=status.HTTP_200_OK,
        )
