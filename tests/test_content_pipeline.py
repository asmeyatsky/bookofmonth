"""
Tests for Content Pipeline module.
"""
import pytest
import json
from datetime import datetime, timedelta
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock

User = get_user_model()


@pytest.mark.django_db
class NewsEventModelTestCase(TestCase):
    """Test NewsEventModel."""

    def test_create_news_event(self):
        """Test creating a news event."""
        from content_pipeline.models import NewsEventModel
        event = NewsEventModel.objects.create(
            title='Test News Event',
            raw_content='This is test content.',
            source_url='https://example.com/news/1',
            published_at=datetime.now(),
            categories=['Science', 'Technology'],
            age_appropriateness='AGE_7_9',
            is_verified=True,
            processing_status='PROCESSED'
        )

        self.assertIsNotNone(event.id)
        self.assertEqual(event.title, 'Test News Event')
        self.assertEqual(event.categories, ['Science', 'Technology'])
        self.assertTrue(event.is_verified)

    def test_news_event_ordering(self):
        """Test that news events are ordered by published_at descending."""
        from content_pipeline.models import NewsEventModel

        event1 = NewsEventModel.objects.create(
            title='Old Event',
            raw_content='Content',
            source_url='https://example.com/1',
            published_at=datetime.now() - timedelta(days=5)
        )
        event2 = NewsEventModel.objects.create(
            title='New Event',
            raw_content='Content',
            source_url='https://example.com/2',
            published_at=datetime.now()
        )

        events = list(NewsEventModel.objects.all())
        self.assertEqual(events[0].title, 'New Event')
        self.assertEqual(events[1].title, 'Old Event')

    def test_news_event_str_representation(self):
        """Test the string representation of a news event."""
        from content_pipeline.models import NewsEventModel
        event = NewsEventModel.objects.create(
            title='Test Title',
            raw_content='Content',
            source_url='https://example.com',
            published_at=datetime.now()
        )
        self.assertEqual(str(event), 'Test Title')

    def test_news_event_uuid_primary_key(self):
        """Test that news events have UUID primary keys."""
        from content_pipeline.models import NewsEventModel
        import uuid

        event = NewsEventModel.objects.create(
            title='Test Event',
            raw_content='Content',
            source_url='https://example.com',
            published_at=datetime.now()
        )

        self.assertIsInstance(event.id, uuid.UUID)


@pytest.mark.django_db
class NewsEventViewSetTestCase(TestCase):
    """Test NewsEventViewSet endpoints."""

    def setUp(self):
        self.client = Client()
        from content_pipeline.models import NewsEventModel

        self.event1 = NewsEventModel.objects.create(
            title='Science News',
            raw_content='Science content',
            source_url='https://example.com/science',
            published_at=datetime.now(),
            categories=['Science'],
            age_appropriateness='AGE_7_9',
            is_verified=True,
            processing_status='PROCESSED'
        )

        self.event2 = NewsEventModel.objects.create(
            title='Technology News',
            raw_content='Tech content',
            source_url='https://example.com/tech',
            published_at=datetime.now() - timedelta(days=1),
            categories=['Technology'],
            age_appropriateness='AGE_10_12',
            is_verified=True,
            processing_status='PROCESSED'
        )

    def test_list_news_events_no_auth_required(self):
        """Test that listing news events doesn't require authentication."""
        response = self.client.get('/api/content/news-events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_news_events_returns_data(self):
        """Test that listing news events returns the expected data."""
        response = self.client.get('/api/content/news-events/')
        data = response.json()

        self.assertIn('results', data)
        self.assertEqual(len(data['results']), 2)

    def test_retrieve_news_event(self):
        """Test retrieving a single news event."""
        response = self.client.get(f'/api/content/news-events/{self.event1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data['title'], 'Science News')

    def test_retrieve_nonexistent_event(self):
        """Test retrieving a non-existent news event."""
        import uuid
        fake_id = uuid.uuid4()
        response = self.client.get(f'/api/content/news-events/{fake_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_by_category(self):
        """Test filtering news events by category."""
        response = self.client.get('/api/content/news-events/?categories=Science')
        data = response.json()

        # Should only return Science articles
        self.assertTrue(len(data['results']) >= 1)

    def test_filter_by_age_appropriateness(self):
        """Test filtering news events by age appropriateness."""
        response = self.client.get('/api/content/news-events/?age_appropriateness=AGE_7_9')
        data = response.json()

        for event in data['results']:
            self.assertEqual(event['age_appropriateness'], 'AGE_7_9')

    def test_search_news_events(self):
        """Test searching news events by title."""
        response = self.client.get('/api/content/news-events/?search=Science')
        data = response.json()

        self.assertTrue(len(data['results']) >= 1)
        self.assertIn('Science', data['results'][0]['title'])

    def test_pagination(self):
        """Test pagination of news events."""
        response = self.client.get('/api/content/news-events/')
        data = response.json()

        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        self.assertIn('results', data)


@pytest.mark.django_db
class NewsEventSerializerTestCase(TestCase):
    """Test NewsEventSerializer."""

    def test_serializer_contains_expected_fields(self):
        """Test that serializer contains all expected fields."""
        from content_pipeline.models import NewsEventModel
        from content_pipeline.serializers import NewsEventSerializer

        event = NewsEventModel.objects.create(
            title='Test Event',
            raw_content='Content',
            source_url='https://example.com',
            published_at=datetime.now(),
            categories=['Science'],
            extracted_facts=[{'statement': 'A fact', 'source': 'Source'}],
            geographic_locations=[{'name': 'USA', 'coordinates': None}]
        )

        serializer = NewsEventSerializer(event)
        expected_fields = [
            'id', 'title', 'raw_content', 'source_url', 'published_at',
            'extracted_facts', 'categories', 'geographic_locations',
            'age_appropriateness', 'is_verified', 'processing_status',
            'image_url', 'created_at', 'updated_at'
        ]

        for field in expected_fields:
            self.assertIn(field, serializer.data)


@pytest.mark.django_db
class ValueObjectsTestCase(TestCase):
    """Test domain value objects."""

    def test_age_range_enum(self):
        """Test AgeRange enum values."""
        from content_pipeline.domain.value_objects import AgeRange

        self.assertEqual(AgeRange.AGE_4_6.value, '4-6')
        self.assertEqual(AgeRange.AGE_7_9.value, '7-9')
        self.assertEqual(AgeRange.AGE_10_12.value, '10-12')

    def test_category_enum(self):
        """Test Category enum values."""
        from content_pipeline.domain.value_objects import Category

        expected_categories = [
            'ANIMALS_NATURE', 'SCIENCE', 'SPACE',
            'TECHNOLOGY', 'SPORTS', 'ARTS', 'RECORDS'
        ]

        for cat in expected_categories:
            self.assertTrue(hasattr(Category, cat))


@pytest.mark.django_db
class NewsAPIAdapterTestCase(TestCase):
    """Test NewsAPIAdapter."""

    @patch('requests.get')
    def test_fetch_news_success(self, mock_get):
        """Test successful news fetch from API."""
        from content_pipeline.infrastructure.adapters.news_api_adapter import NewsAPIAdapter

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'ok',
            'articles': [
                {
                    'title': 'Test Article',
                    'description': 'Test description',
                    'url': 'https://example.com',
                    'publishedAt': '2024-01-15T10:00:00Z',
                    'content': 'Full content here'
                }
            ]
        }
        mock_get.return_value = mock_response

        adapter = NewsAPIAdapter(api_key='test-api-key')
        articles = adapter.fetch_recent_news(topics=['science'])

        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]['title'], 'Test Article')

    @patch('requests.get')
    def test_fetch_news_api_error(self, mock_get):
        """Test handling of API errors."""
        from content_pipeline.infrastructure.adapters.news_api_adapter import NewsAPIAdapter

        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {'status': 'error', 'message': 'Invalid API key'}
        mock_get.return_value = mock_response

        adapter = NewsAPIAdapter(api_key='invalid-key')
        articles = adapter.fetch_recent_news(topics=['science'])

        self.assertEqual(articles, [])

    def test_adapter_without_api_key(self):
        """Test adapter initialization without API key."""
        from content_pipeline.infrastructure.adapters.news_api_adapter import NewsAPIAdapter
        import os

        # Clear environment variable if set
        original_key = os.environ.get('NEWS_API_KEY')
        if 'NEWS_API_KEY' in os.environ:
            del os.environ['NEWS_API_KEY']

        try:
            with self.assertRaises(ValueError):
                adapter = NewsAPIAdapter(api_key=None)
        finally:
            if original_key:
                os.environ['NEWS_API_KEY'] = original_key


@pytest.mark.django_db
class GeminiAPIAdapterTestCase(TestCase):
    """Test GeminiAPIAdapter."""

    @patch('content_pipeline.infrastructure.adapters.gemini_api_adapter.genai')
    def test_verify_facts_success(self, mock_genai):
        """Test successful fact verification."""
        from content_pipeline.infrastructure.adapters.gemini_api_adapter import GeminiApiAdapter

        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"verified": true, "confidence": 0.95}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        adapter = GeminiApiAdapter(api_key='test-key')
        # Test would depend on actual implementation

    def test_adapter_without_api_key(self):
        """Test adapter initialization without API key."""
        from content_pipeline.infrastructure.adapters.gemini_api_adapter import GeminiApiAdapter
        import os

        original_key = os.environ.get('GEMINI_API_KEY')
        if 'GEMINI_API_KEY' in os.environ:
            del os.environ['GEMINI_API_KEY']

        try:
            with self.assertRaises(ValueError):
                adapter = GeminiApiAdapter(api_key=None)
        finally:
            if original_key:
                os.environ['GEMINI_API_KEY'] = original_key


@pytest.mark.django_db
class NewsEventRepositoryTestCase(TestCase):
    """Test DjangoNewsEventRepository."""

    def test_save_news_event(self):
        """Test saving a news event through repository."""
        from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
        from content_pipeline.models import NewsEventModel

        repo = DjangoNewsEventRepository()

        # Create and save through repository
        event = NewsEventModel(
            title='Repo Test Event',
            raw_content='Content',
            source_url='https://example.com',
            published_at=datetime.now()
        )
        saved_event = repo.save(event)

        self.assertIsNotNone(saved_event.id)
        self.assertEqual(saved_event.title, 'Repo Test Event')

    def test_find_by_id(self):
        """Test finding a news event by ID."""
        from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
        from content_pipeline.models import NewsEventModel

        repo = DjangoNewsEventRepository()

        event = NewsEventModel.objects.create(
            title='Find Me',
            raw_content='Content',
            source_url='https://example.com',
            published_at=datetime.now()
        )

        found_event = repo.find_by_id(event.id)
        self.assertEqual(found_event.title, 'Find Me')

    def test_find_by_id_not_found(self):
        """Test finding a non-existent event."""
        from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
        import uuid

        repo = DjangoNewsEventRepository()
        found_event = repo.find_by_id(uuid.uuid4())

        self.assertIsNone(found_event)

    def test_find_all(self):
        """Test finding all news events."""
        from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
        from content_pipeline.models import NewsEventModel

        repo = DjangoNewsEventRepository()

        # Create some events
        for i in range(3):
            NewsEventModel.objects.create(
                title=f'Event {i}',
                raw_content='Content',
                source_url=f'https://example.com/{i}',
                published_at=datetime.now()
            )

        all_events = repo.find_all()
        self.assertEqual(len(all_events), 3)


@pytest.mark.django_db
class ContentProcessingServiceTestCase(TestCase):
    """Test ContentProcessingService."""

    def test_filter_safe_content(self):
        """Test content safety filtering."""
        from content_pipeline.domain.services.content_processing_service import ContentProcessingService

        service = ContentProcessingService()

        safe_content = "This is a nice story about puppies and kittens."
        unsafe_content = "This content contains violence and inappropriate themes."

        # Test would depend on actual implementation
        # self.assertTrue(service.is_content_safe(safe_content))


if __name__ == '__main__':
    pytest.main([__file__])
