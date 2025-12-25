# Tests for Users App

import pytest
import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch, MagicMock

User = get_user_model()


class UserAuthenticationTestCase(TestCase):
    """Test user authentication endpoints."""
    
    def setUp(self):
        self.client = Client()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
    def test_user_registration_success(self):
        """Test successful user registration."""
        response = self.client.post(
            reverse('user-register'),
            data=json.dumps(self.user_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        
    def test_user_registration_duplicate_username(self):
        """Test registration with duplicate username."""
        User.objects.create_user(**self.user_data)
        
        response = self.client.post(
            reverse('user-register'),
            data=json.dumps(self.user_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        
    def test_user_login_success(self):
        """Test successful user login."""
        User.objects.create_user(**self.user_data)
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(
            reverse('user-login'),
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(
            reverse('user-login'),
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])
        
    def test_user_logout_success(self):
        """Test successful user logout."""
        user = User.objects.create_user(**self.user_data)
        token = Token.objects.create(user=user)
        
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        response = self.client.post(reverse('user-logout'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())


class UserProfileTestCase(TestCase):
    """Test user profile management."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {self.token.key}'
        
    def test_get_user_profile(self):
        """Test getting user profile."""
        response = self.client.get(reverse('customuser-me'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        
    def test_update_user_profile(self):
        """Test updating user profile."""
        update_data = {
            'email': 'updated@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.patch(
            reverse('customuser-me'),
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(id=self.user.id)
        self.assertEqual(user.email, 'updated@example.com')


class ReadingProgressTestCase(TestCase):
    """Test reading progress tracking."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {self.token.key}'
        
        # Create test news event
        from content_pipeline.models import NewsEventModel
        self.news_event = NewsEventModel.objects.create(
            title='Test News Event',
            raw_content='Test content',
            source_url='https://example.com',
            processing_status='RAW'
        )
        
    def test_create_reading_progress(self):
        """Test creating reading progress."""
        progress_data = {
            'news_event': str(self.news_event.id),
            'completed': False
        }
        
        response = self.client.post(
            reverse('readingprogress-list'),
            data=json.dumps(progress_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('news_event', response.data['data'])
        
    def test_complete_reading_progress_triggers_achievement(self):
        """Test that completing reading progress triggers achievements."""
        progress_data = {
            'news_event': str(self.news_event.id),
            'completed': True
        }
        
        with patch('users.services.AchievementService.mark_content_complete') as mock_service:
            response = self.client.post(
                reverse('readingprogress-list'),
                data=json.dumps(progress_data),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            mock_service.assert_called_once()


class AchievementTestCase(TestCase):
    """Test achievement system."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {self.token.key}'
        
    def test_update_reading_streak(self):
        """Test reading streak update."""
        response = self.client.post(reverse('readingstreak-update-streak'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current_streak', response.data['data'])
        
    @patch('users.services.AchievementService.mark_content_complete')
    def test_mark_content_complete(self, mock_service):
        """Test marking content as complete."""
        from content_pipeline.models import NewsEventModel
        news_event = NewsEventModel.objects.create(
            title='Test Event',
            raw_content='Test content',
            source_url='https://example.com',
            processing_status='RAW'
        )
        
        response = self.client.post(
            reverse('readingstreak-mark-content-complete'),
            data=json.dumps({'news_event_id': str(news_event.id)}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_service.assert_called_once()


class ChildProfileTestCase(TestCase):
    """Test child profile management."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {self.token.key}'
        
    def test_create_child_profile(self):
        """Test creating a child profile."""
        profile_data = {
            'name': 'Test Child',
            'age': 8,
            'reading_level': 'AGE_7_9'
        }
        
        response = self.client.post(
            reverse('childprofile-list'),
            data=json.dumps(profile_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['name'], 'Test Child')
        
    def test_list_child_profiles(self):
        """Test listing child profiles."""
        response = self.client.get(reverse('childprofile-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
    def test_update_child_profile(self):
        """Test updating a child profile."""
        from users.models import ChildProfile
        profile = ChildProfile.objects.create(
            user=self.user,
            name='Test Child',
            age=8,
            reading_level='AGE_7_9'
        )
        
        update_data = {'age': 9}
        response = self.client.patch(
            reverse('childprofile-detail', kwargs={'pk': profile.id}),
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.age, 9)


if __name__ == '__main__':
    pytest.main([__file__])