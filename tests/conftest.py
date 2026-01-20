"""
Pytest configuration and fixtures for the test suite.
"""
import os
import pytest
from datetime import datetime, timedelta
from django.conf import settings

# Configure Django settings before running tests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookofmonth_backend.settings')


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests."""
    pass


@pytest.fixture
def api_client():
    """Return a Django REST Framework API client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Return an authenticated API client."""
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return api_client


@pytest.fixture
def test_user(db):
    """Create a test user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='TestPass123!'
    )
    return user


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='AdminPass123!'
    )
    return user


@pytest.fixture
def news_event(db):
    """Create a test news event."""
    from content_pipeline.models import NewsEventModel
    return NewsEventModel.objects.create(
        title='Test News Event',
        raw_content='This is test content for a news event about science.',
        source_url='https://example.com/news/1',
        published_at=datetime.now(),
        categories=['Science'],
        age_appropriateness='AGE_7_9',
        is_verified=True,
        processing_status='PROCESSED'
    )


@pytest.fixture
def multiple_news_events(db):
    """Create multiple test news events."""
    from content_pipeline.models import NewsEventModel
    events = []
    for i in range(5):
        event = NewsEventModel.objects.create(
            title=f'Test News Event {i}',
            raw_content=f'Content for news event {i}',
            source_url=f'https://example.com/news/{i}',
            published_at=datetime.now() - timedelta(days=i),
            categories=['Science'] if i % 2 == 0 else ['Technology'],
            age_appropriateness='AGE_7_9',
            is_verified=True,
            processing_status='PROCESSED'
        )
        events.append(event)
    return events


@pytest.fixture
def monthly_book(db, news_event):
    """Create a test monthly book."""
    from book_assembly.models import MonthlyBookModel
    return MonthlyBookModel.objects.create(
        month=1,
        year=2024,
        title='January 2024 Book',
        cover_image_url='https://example.com/cover.jpg',
        daily_entries=[str(news_event.id)],
        end_of_month_quiz=[],
        parents_guide='This is a guide for parents.'
    )


@pytest.fixture
def quiz(db, monthly_book):
    """Create a test quiz."""
    from quizzes.models import Quiz
    return Quiz.objects.create(
        monthly_book=monthly_book,
        title='January 2024 Quiz'
    )


@pytest.fixture
def quiz_with_questions(db, quiz):
    """Create a quiz with questions."""
    from quizzes.models import Question
    questions = []
    for i in range(3):
        q = Question.objects.create(
            quiz=quiz,
            text=f'Question {i + 1}?',
            option_a='Option A',
            option_b='Option B',
            option_c='Option C',
            option_d='Option D',
            correct_answer='A'
        )
        questions.append(q)
    return quiz, questions


@pytest.fixture
def child_profile(db, test_user):
    """Create a test child profile."""
    from users.models import ChildProfile
    return ChildProfile.objects.create(
        user=test_user,
        name='Test Child',
        age=8,
        reading_level='AGE_7_9'
    )


@pytest.fixture
def achievement(db):
    """Create a test achievement."""
    from users.models import Achievement
    return Achievement.objects.create(
        name='First Reader',
        description='Read your first article'
    )


# Celery test configuration
@pytest.fixture(scope='session')
def celery_config():
    """Configure Celery for testing."""
    return {
        'broker_url': 'memory://',
        'result_backend': 'cache+memory://',
        'task_always_eager': True,
        'task_eager_propagates': True,
    }
