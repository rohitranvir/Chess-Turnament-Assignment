from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User
from players.models import Player
from tournaments.models import Tournament, TournamentPlayer
import datetime

class TournamentTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="password", role="admin")
        self.viewer = User.objects.create_user(username="viewer", password="password", role="viewer")
        
        self.p1 = Player.objects.create(name="P1", email="p1@test.com", rating=2000)
        self.p2 = Player.objects.create(name="P2", email="p2@test.com", rating=2100)
        self.p3 = Player.objects.create(name="P3", email="p3@test.com", rating=2200)

        self.t = Tournament.objects.create(
            name="Test Tournament",
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=1),
            status=Tournament.Status.UPCOMING
        )

    def test_add_player_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('tournament-add-player', kwargs={'pk': self.t.pk})
        response = self.client.post(url, {"player_id": self.p1.pk})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TournamentPlayer.objects.filter(tournament=self.t, player=self.p1).exists())

    def test_add_player_viewer_forbidden(self):
        self.client.force_authenticate(user=self.viewer)
        url = reverse('tournament-add-player', kwargs={'pk': self.t.pk})
        response = self.client.post(url, {"player_id": self.p1.pk})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_player_completed_tournament(self):
        self.client.force_authenticate(user=self.admin)
        self.t.status = Tournament.Status.COMPLETED
        self.t.save()
        url = reverse('tournament-add-player', kwargs={'pk': self.t.pk})
        response = self.client.post(url, {"player_id": self.p1.pk})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")

    def test_edit_completed_tournament(self):
        self.client.force_authenticate(user=self.admin)
        self.t.status = Tournament.Status.COMPLETED
        self.t.save()
        url = reverse('tournament-detail', kwargs={'pk': self.t.pk})
        response = self.client.patch(url, {"name": "New Name"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rankings(self):
        # Add players
        TournamentPlayer.objects.create(tournament=self.t, player=self.p1, points=5)
        TournamentPlayer.objects.create(tournament=self.t, player=self.p2, points=3)
        TournamentPlayer.objects.create(tournament=self.t, player=self.p3, points=5) # tie with p1
        
        self.client.force_authenticate(user=self.viewer)
        url = reverse('tournament-rankings', kwargs={'pk': self.t.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rankings = response.data['rankings']
        self.assertEqual(len(rankings), 3)
        self.assertEqual(rankings[0]['rank'], 1)
        self.assertEqual(rankings[1]['rank'], 1) # tied
        self.assertEqual(rankings[2]['rank'], 3) # next rank skips
