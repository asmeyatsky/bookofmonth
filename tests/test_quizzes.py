# Tests for Quizzes App

import pytest
import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch, MagicMock

User = get_user_model()


class QuizTestCase(TestCase):
    """Test quiz functionality."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {self.token.key}'
        
        # Create test quiz
        from quizzes.models import Quiz, Question
        from book_assembly.models import MonthlyBookModel
        from content_pipeline.models import NewsEventModel
        
        monthly_book = MonthlyBookModel.objects.create(
            month=12,
            year=2024,
            title='Test Book'
        )
        
        self.quiz = Quiz.objects.create(
            monthly_book=monthly_book,
            title='Test Quiz'
        )
        
        self.question = Question.objects.create(
            quiz=self.quiz,
            text='What is 2+2?',
            options=['3', '4', '5', '6'],
            correct_answer='4'
        )
        
    def test_list_quizzes(self):
        """Test listing all quizzes."""
        response = self.client.get(reverse('quiz-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
    def test_retrieve_quiz(self):
        """Test retrieving a specific quiz."""
        response = self.client.get(reverse('quiz-detail', kwargs={'pk': self.quiz.id}))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.quiz.id))
        
    def test_list_questions(self):
        """Test listing quiz questions."""
        response = self.client.get(reverse('question-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
    def test_submit_quiz_answers(self):
        """Test submitting quiz answers."""
        submission_data = {
            'quiz': str(self.quiz.id),
            'answers': [
                {
                    'question': str(self.question.id),
                    'selected_answer': '4'
                }
            ]
        }
        
        response = self.client.post(
            reverse('quizsubmission-list'),
            data=json.dumps(submission_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('score', response.data['data'])
        self.assertIn('total_questions', response.data['data'])
        self.assertEqual(response.data['data']['score'], 1)
        self.assertEqual(response.data['data']['total_questions'], 1)
        
    def test_submit_quiz_answers_incorrect(self):
        """Test submitting quiz with incorrect answers."""
        submission_data = {
            'quiz': str(self.quiz.id),
            'answers': [
                {
                    'question': str(self.question.id),
                    'selected_answer': '5'  # Wrong answer
                }
            ]
        }
        
        response = self.client.post(
            reverse('quizsubmission-list'),
            data=json.dumps(submission_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['score'], 0)  # No correct answers
        
    def test_submit_duplicate_quiz(self):
        """Test that duplicate quiz submissions are rejected."""
        submission_data = {
            'quiz': str(self.quiz.id),
            'answers': [
                {
                    'question': str(self.question.id),
                    'selected_answer': '4'
                }
            ]
        }
        
        # First submission
        response1 = self.client.post(
            reverse('quizsubmission-list'),
            data=json.dumps(submission_data),
            content_type='application/json'
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second submission should fail
        response2 = self.client.post(
            reverse('quizsubmission-list'),
            data=json.dumps(submission_data),
            content_type='application/json'
        )
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response2.data['success'])
        
    def test_get_quiz_submission_by_quiz(self):
        """Test getting submission for a specific quiz."""
        # First create a submission
        submission_data = {
            'quiz': str(self.quiz.id),
            'answers': [
                {
                    'question': str(self.question.id),
                    'selected_answer': '4'
                }
            ]
        }
        
        self.client.post(
            reverse('quizsubmission-list'),
            data=json.dumps(submission_data),
            content_type='application/json'
        )
        
        # Then get it by quiz
        response = self.client.get(
            f"{reverse('quizsubmission-by-quiz')}?quiz_id={self.quiz.id}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
    def test_get_quiz_submission_not_found(self):
        """Test getting submission for non-existent quiz."""
        fake_quiz_id = '12345678-1234-5678-1234-567812345678'
        
        response = self.client.get(
            f"{reverse('quizsubmission-by-quiz')}?quiz_id={fake_quiz_id}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        
    def test_submit_quiz_missing_quiz_id(self):
        """Test submitting quiz without quiz ID."""
        submission_data = {
            'answers': []  # Missing quiz ID
        }
        
        response = self.client.post(
            reverse('quizsubmission-list'),
            data=json.dumps(submission_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])


class QuestionTestCase(TestCase):
    """Test quiz questions."""
    
    def setUp(self):
        self.client = Client()
        # No authentication needed for read-only endpoints
        
    def test_questions_are_public(self):
        """Test that questions can be accessed without authentication."""
        response = self.client.get(reverse('question-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_quizzes_are_public(self):
        """Test that quizzes can be accessed without authentication."""
        response = self.client.get(reverse('quiz-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


if __name__ == '__main__':
    pytest.main([__file__])