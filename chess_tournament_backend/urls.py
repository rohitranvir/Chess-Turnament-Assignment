"""chess_tournament_backend URL Configuration."""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("players.urls")),
    path("api/", include("tournaments.urls")),
    path("api/", include("matches.urls")),
]
