"""Player views — full CRUD via DRF ModelViewSet."""

from rest_framework import viewsets, status
from rest_framework.response import Response

from common.permissions import IsAuthenticatedReadOnly
from .models import Player
from .serializers import PlayerSerializer


class PlayerViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides CRUD operations for Player model.

    list:      GET  /api/players/
    create:    POST /api/players/
    retrieve:  GET  /api/players/{id}/
    update:    PUT  /api/players/{id}/
    partial:   PATCH /api/players/{id}/
    destroy:   DELETE /api/players/{id}/
    """

    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticatedReadOnly]

    def get_queryset(self):
        """Allow optional filtering by country and/or name via query params."""
        qs = super().get_queryset()
        country = self.request.query_params.get("country")
        name = self.request.query_params.get("name")
        if country:
            qs = qs.filter(country__icontains=country)
        if name:
            qs = qs.filter(name__icontains=name)
        return qs

    def destroy(self, request, *args, **kwargs):
        """Return a JSON message on successful delete."""
        instance = self.get_object()
        player_name = instance.name
        self.perform_destroy(instance)
        return Response(
            {"message": f"Player '{player_name}' deleted successfully."},
            status=status.HTTP_200_OK,
        )
