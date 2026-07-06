from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User
from players.models import Player
from tournaments.models import Tournament, TournamentPlayer
from matches.models import Match
import datetime

class MatchTests(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="password", role="admin")
        self.viewer = User.objects.create_user(username="viewer", password="password", role="viewer")
        
        self.t = Tournament.objects.create(
            name="Test Tournament",
            start_date=datetime.date.today(),
            end_date=datetime.date.today() + datetime.timedelta(days=1)
        )
        self.p1 = Player.objects.create(name="P1", email="p1@test.com", rating=2000)
        self.p2 = Player.objects.create(name="P2", email="p2@test.com", rating=2100)
        self.p3 = Player.objects.create(name="P3", email="p3@test.com", rating=2200)

        TournamentPlayer.objects.create(tournament=self.t, player=self.p1)
        TournamentPlayer.objects.create(tournament=self.t, player=self.p2)
        TournamentPlayer.objects.create(tournament=self.t, player=self.p3)

    def test_generate_matches_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('tournament-generate-matches', kwargs={'pk': self.t.pk})
        response = self.client.post(url, {"round_number": 1})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Match.objects.count(), 2) # 3 players = 1 pair + 1 bye
        self.assertEqual(response.data["bye_count"], 1)

    def test_generate_matches_twice_fails(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('tournament-generate-matches', kwargs={'pk': self.t.pk})
        self.client.post(url, {"round_number": 1})
        response = self.client.post(url, {"round_number": 1}) # again
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")
        self.assertIn("already been generated", response.data["error"]["message"])

    def test_simulate_match(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('tournament-generate-matches', kwargs={'pk': self.t.pk})
        self.client.post(url, {"round_number": 1})
        
        match = Match.objects.filter(player_black__isnull=False).first() # get the non-bye match
        sim_url = reverse('match-simulate', kwargs={'pk': match.pk})
        response = self.client.post(sim_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        match.refresh_from_db()
        self.assertNotEqual(match.result, Match.Result.PENDING)

    def test_simulate_already_decided_match(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('tournament-generate-matches', kwargs={'pk': self.t.pk})
        self.client.post(url, {"round_number": 1})
        
        match = Match.objects.filter(player_black__isnull=False).first()
        match.result = Match.Result.WHITE_WIN
        match.save()
        
        sim_url = reverse('match-simulate', kwargs={'pk': match.pk})
        response = self.client.post(sim_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "validation_error")

    def test_simulate_round(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('tournament-generate-matches', kwargs={'pk': self.t.pk})
        self.client.post(url, {"round_number": 1})
        
        sim_round_url = reverse('tournament-simulate-round', kwargs={'pk': self.t.pk, 'round_number': 1})
        response = self.client.post(sim_round_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["simulated_count"], 1) # 1 actual match
        
        # Verify no matches are pending
        pending = Match.objects.filter(result=Match.Result.PENDING).count()
        self.assertEqual(pending, 0)
