from rest_framework import viewsets, permissions
from .models import Quiz, Question
from .serializers import QuizSerializer, QuestionSerializer


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for quizzes.
    Public read-only access - no authentication required.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.AllowAny]


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for quiz questions.
    Public read-only access - no authentication required.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.AllowAny]
