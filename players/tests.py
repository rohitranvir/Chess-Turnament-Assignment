from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from users.models import User
from players.models import Player


class PlayerTests(APITestCase):

    def setUp(self):
        self.admin_user = User.objects.create_user(username="admin", password="password", role="admin")
        self.viewer_user = User.objects.create_user(username="viewer", password="password", role="viewer")
        self.list_url = reverse('player-list')
        
        self.player = Player.objects.create(name="Magnus", email="magnus@test.com", rating=2882)
        self.detail_url = reverse('player-detail', kwargs={'pk': self.player.pk})

    def test_list_players_viewer(self):
        self.client.force_authenticate(user=self.viewer_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_create_player_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {"name": "Hikaru", "email": "hikaru@test.com", "rating": 2789}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Player.objects.count(), 2)

    def test_create_player_viewer_forbidden(self):
        self.client.force_authenticate(user=self.viewer_user)
        data = {"name": "Hikaru", "email": "hikaru@test.com", "rating": 2789}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_create_player_validation_error(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {"name": "Hikaru", "email": "hikaru@test.com", "rating": -100}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check global exception handler format
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"]["code"], "validation_error")
