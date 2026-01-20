"""
Tests for Book Assembly module.
"""
import pytest
import json
from datetime import datetime
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
class MonthlyBookModelTestCase(TestCase):
    """Test MonthlyBookModel."""

    def test_create_monthly_book(self):
        """Test creating a monthly book."""
        from book_assembly.models import MonthlyBookModel

        book = MonthlyBookModel.objects.create(
            month=1,
            year=2024,
            title='January 2024 Book',
            cover_image_url='https://example.com/cover.jpg',
            daily_entries=[],
            end_of_month_quiz=[],
            parents_guide='Guide for parents'
        )

        self.assertIsNotNone(book.id)
        self.assertEqual(book.title, 'January 2024 Book')
        self.assertEqual(book.month, 1)
        self.assertEqual(book.year, 2024)

    def test_monthly_book_unique_constraint(self):
        """Test that year/month combination is unique."""
        from book_assembly.models import MonthlyBookModel
        from django.db import IntegrityError

        MonthlyBookModel.objects.create(
            month=1,
            year=2024,
            title='January 2024',
            cover_image_url='https://example.com/cover.jpg'
        )

        with self.assertRaises(IntegrityError):
            MonthlyBookModel.objects.create(
                month=1,
                year=2024,
                title='Another January 2024',
                cover_image_url='https://example.com/cover2.jpg'
            )

    def test_monthly_book_ordering(self):
        """Test that books are ordered by year and month descending."""
        from book_assembly.models import MonthlyBookModel

        book1 = MonthlyBookModel.objects.create(
            month=1, year=2024, title='Jan 2024',
            cover_image_url='https://example.com/1.jpg'
        )
        book2 = MonthlyBookModel.objects.create(
            month=12, year=2023, title='Dec 2023',
            cover_image_url='https://example.com/2.jpg'
        )
        book3 = MonthlyBookModel.objects.create(
            month=2, year=2024, title='Feb 2024',
            cover_image_url='https://example.com/3.jpg'
        )

        books = list(MonthlyBookModel.objects.all())
        self.assertEqual(books[0].title, 'Feb 2024')
        self.assertEqual(books[1].title, 'Jan 2024')
        self.assertEqual(books[2].title, 'Dec 2023')

    def test_monthly_book_str_representation(self):
        """Test the string representation of a monthly book."""
        from book_assembly.models import MonthlyBookModel

        book = MonthlyBookModel.objects.create(
            month=3, year=2024, title='March Adventures',
            cover_image_url='https://example.com/cover.jpg'
        )

        self.assertEqual(str(book), 'March Adventures')

    def test_monthly_book_with_daily_entries(self):
        """Test monthly book with daily entry references."""
        from book_assembly.models import MonthlyBookModel
        from content_pipeline.models import NewsEventModel

        # Create news events
        event1 = NewsEventModel.objects.create(
            title='Day 1 News',
            raw_content='Content',
            source_url='https://example.com/1',
            published_at=datetime.now()
        )
        event2 = NewsEventModel.objects.create(
            title='Day 2 News',
            raw_content='Content',
            source_url='https://example.com/2',
            published_at=datetime.now()
        )

        book = MonthlyBookModel.objects.create(
            month=4, year=2024, title='April 2024',
            cover_image_url='https://example.com/cover.jpg',
            daily_entries=[str(event1.id), str(event2.id)]
        )

        self.assertEqual(len(book.daily_entries), 2)


@pytest.mark.django_db
class MonthlyBookViewSetTestCase(TestCase):
    """Test MonthlyBookViewSet endpoints."""

    def setUp(self):
        self.client = Client()
        from book_assembly.models import MonthlyBookModel

        self.book1 = MonthlyBookModel.objects.create(
            month=1, year=2024, title='January 2024',
            cover_image_url='https://example.com/jan.jpg',
            parents_guide='January guide'
        )
        self.book2 = MonthlyBookModel.objects.create(
            month=2, year=2024, title='February 2024',
            cover_image_url='https://example.com/feb.jpg',
            parents_guide='February guide'
        )

    def test_list_monthly_books_no_auth_required(self):
        """Test that listing books doesn't require authentication."""
        response = self.client.get('/api/assembly/monthly-books/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_monthly_books_returns_data(self):
        """Test that listing books returns expected data."""
        response = self.client.get('/api/assembly/monthly-books/')
        data = response.json()

        self.assertIn('results', data)
        self.assertEqual(len(data['results']), 2)

    def test_retrieve_monthly_book(self):
        """Test retrieving a single monthly book."""
        response = self.client.get(f'/api/assembly/monthly-books/{self.book1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data['title'], 'January 2024')

    def test_retrieve_nonexistent_book(self):
        """Test retrieving a non-existent book."""
        import uuid
        fake_id = uuid.uuid4()
        response = self.client.get(f'/api/assembly/monthly-books/{fake_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_by_year(self):
        """Test filtering books by year."""
        response = self.client.get('/api/assembly/monthly-books/?year=2024')
        data = response.json()

        for book in data['results']:
            self.assertEqual(book['year'], 2024)

    def test_filter_by_month(self):
        """Test filtering books by month."""
        response = self.client.get('/api/assembly/monthly-books/?month=1')
        data = response.json()

        self.assertTrue(len(data['results']) >= 1)

    def test_pagination(self):
        """Test pagination of monthly books."""
        response = self.client.get('/api/assembly/monthly-books/')
        data = response.json()

        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)


@pytest.mark.django_db
class MonthlyBookSerializerTestCase(TestCase):
    """Test MonthlyBookSerializer."""

    def test_serializer_contains_expected_fields(self):
        """Test that serializer contains all expected fields."""
        from book_assembly.models import MonthlyBookModel
        from book_assembly.serializers import MonthlyBookSerializer

        book = MonthlyBookModel.objects.create(
            month=5, year=2024, title='May 2024',
            cover_image_url='https://example.com/may.jpg',
            daily_entries=['entry1', 'entry2'],
            end_of_month_quiz=[{'q': 'Question?'}],
            parents_guide='May guide'
        )

        serializer = MonthlyBookSerializer(book)
        expected_fields = [
            'id', 'month', 'year', 'title', 'cover_image_url',
            'daily_entries', 'end_of_month_quiz', 'parents_guide',
            'created_at', 'updated_at'
        ]

        for field in expected_fields:
            self.assertIn(field, serializer.data)


@pytest.mark.django_db
class MonthlyBookFilterTestCase(TestCase):
    """Test MonthlyBookFilter."""

    def setUp(self):
        from book_assembly.models import MonthlyBookModel

        self.book_2023_12 = MonthlyBookModel.objects.create(
            month=12, year=2023, title='December 2023',
            cover_image_url='https://example.com/dec23.jpg'
        )
        self.book_2024_01 = MonthlyBookModel.objects.create(
            month=1, year=2024, title='January 2024',
            cover_image_url='https://example.com/jan24.jpg'
        )
        self.book_2024_02 = MonthlyBookModel.objects.create(
            month=2, year=2024, title='February 2024',
            cover_image_url='https://example.com/feb24.jpg'
        )

    def test_filter_by_year_and_month(self):
        """Test filtering by both year and month."""
        client = Client()
        response = client.get('/api/assembly/monthly-books/?year=2024&month=1')
        data = response.json()

        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['title'], 'January 2024')


@pytest.mark.django_db
class BookAssemblyRepositoryTestCase(TestCase):
    """Test book assembly repository operations."""

    def test_save_monthly_book(self):
        """Test saving a monthly book."""
        from book_assembly.models import MonthlyBookModel

        book = MonthlyBookModel(
            month=6, year=2024, title='June 2024',
            cover_image_url='https://example.com/june.jpg'
        )
        book.save()

        self.assertIsNotNone(book.id)

    def test_update_monthly_book(self):
        """Test updating a monthly book."""
        from book_assembly.models import MonthlyBookModel

        book = MonthlyBookModel.objects.create(
            month=7, year=2024, title='July 2024',
            cover_image_url='https://example.com/july.jpg'
        )

        book.title = 'July 2024 - Updated'
        book.save()

        book.refresh_from_db()
        self.assertEqual(book.title, 'July 2024 - Updated')

    def test_delete_monthly_book(self):
        """Test deleting a monthly book."""
        from book_assembly.models import MonthlyBookModel

        book = MonthlyBookModel.objects.create(
            month=8, year=2024, title='August 2024',
            cover_image_url='https://example.com/aug.jpg'
        )
        book_id = book.id

        book.delete()

        self.assertFalse(MonthlyBookModel.objects.filter(id=book_id).exists())


@pytest.mark.django_db
class BookAssemblyIntegrationTestCase(TestCase):
    """Integration tests for book assembly with related content."""

    def test_book_with_quiz_relationship(self):
        """Test creating a book with an associated quiz."""
        from book_assembly.models import MonthlyBookModel
        from quizzes.models import Quiz

        book = MonthlyBookModel.objects.create(
            month=9, year=2024, title='September 2024',
            cover_image_url='https://example.com/sep.jpg'
        )

        quiz = Quiz.objects.create(
            monthly_book=book,
            title='September Quiz'
        )

        self.assertEqual(quiz.monthly_book, book)
        self.assertEqual(book.quiz.title, 'September Quiz')

    def test_book_with_news_entries(self):
        """Test book referencing multiple news events."""
        from book_assembly.models import MonthlyBookModel
        from content_pipeline.models import NewsEventModel

        events = []
        for i in range(5):
            event = NewsEventModel.objects.create(
                title=f'News {i}',
                raw_content=f'Content {i}',
                source_url=f'https://example.com/{i}',
                published_at=datetime.now()
            )
            events.append(str(event.id))

        book = MonthlyBookModel.objects.create(
            month=10, year=2024, title='October 2024',
            cover_image_url='https://example.com/oct.jpg',
            daily_entries=events
        )

        self.assertEqual(len(book.daily_entries), 5)


if __name__ == '__main__':
    pytest.main([__file__])
