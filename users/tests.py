from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import User


class UserAuthTests(APITestCase):

    def setUp(self):
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.refresh_url = reverse('auth-refresh')

    def test_user_registration(self):
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "strongpassword123",
            "password2": "strongpassword123",
            "role": "admin"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().role, "admin")

    def test_user_login(self):
        User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="strongpassword123",
            role="viewer"
        )
        data = {
            "username": "testuser",
            "password": "strongpassword123"
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'viewer')

    def test_token_refresh(self):
        user = User.objects.create_user(
            username="testuser",
            password="strongpassword123",
        )
        login_response = self.client.post(self.login_url, {
            "username": "testuser",
            "password": "strongpassword123"
        })
        refresh_token = login_response.data['refresh']
        
        response = self.client.post(self.refresh_url, {"refresh": refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
