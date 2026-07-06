"""Match views — read/update/delete + simulate action."""

from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAuthenticatedReadOnly
from .models import Match
from .serializers import MatchSerializer, MatchUpdateSerializer
from .services import simulate_match_result


class MatchViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Match API — no create (matches are only generated via generate_matches).

    list:     GET  /api/matches/                        (filter: ?tournament_id=, ?round_number=)
    retrieve: GET  /api/matches/{id}/
    update:   PUT  /api/matches/{id}/
    partial:  PATCH /api/matches/{id}/
    destroy:  DELETE /api/matches/{id}/
    simulate: POST /api/matches/{id}/simulate/
    """

    queryset = Match.objects.select_related(
        "tournament", "player_white", "player_black", "winner"
    ).all()
    permission_classes = [IsAuthenticatedReadOnly]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return MatchUpdateSerializer
        return MatchSerializer

    # ------------------------------------------------------------------
    # Filtering via query params
    # ------------------------------------------------------------------

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get("tournament_id")
        round_number = self.request.query_params.get("round_number")

        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        if round_number:
            qs = qs.filter(round_number=round_number)

        return qs

    # ------------------------------------------------------------------
    # Custom action: simulate a single match
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], url_path="simulate")
    def simulate(self, request, pk=None):
        """
        POST /api/matches/{id}/simulate/
        Randomly simulate the result of this pending match and update points.
        """
        try:
            match = simulate_match_result(int(pk))
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except RuntimeError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": f"Match {match.id} simulated successfully.",
                "data": MatchSerializer(match).data,
            },
            status=status.HTTP_200_OK,
        )
