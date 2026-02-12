from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Quiz, Question, QuizSubmission, QuizAnswer
from .serializers import (
    QuizListSerializer, QuestionListSerializer,
    QuizSubmissionSerializer, QuizSubmissionResultSerializer,
)
from .filters import QuizFilter
from utils.error_handling import error_response, success_response, validate_required_fields


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for quizzes.
    Public read-only access - no authentication required.
    Questions are returned WITHOUT correct answers.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = QuizFilter


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for quiz questions.
    Public read-only access - no authentication required.
    Correct answers are NOT included to prevent cheating.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionListSerializer
    permission_classes = [permissions.AllowAny]


class QuizSubmissionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for quiz submissions.
    Authentication required.
    """
    queryset = QuizSubmission.objects.all()
    serializer_class = QuizSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizSubmission.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save()

        # Return results with correct answers after submission
        result_serializer = QuizSubmissionResultSerializer(
            submission, context={'request': request}
        )
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """Return submission with correct answers (user already submitted)."""
        instance = self.get_object()
        serializer = QuizSubmissionResultSerializer(instance, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_quiz(self, request):
        """Get submission for a specific quiz"""
        try:
            validate_required_fields(request.query_params, ['quiz_id'])
            quiz_id = request.query_params['quiz_id']

            try:
                submission = QuizSubmission.objects.get(
                    user=request.user,
                    quiz_id=quiz_id
                )
                serializer = QuizSubmissionResultSerializer(
                    submission, context={'request': request}
                )
                return success_response(serializer.data)
            except QuizSubmission.DoesNotExist:
                return error_response(
                    message='No submission found for this quiz',
                    status_code=status.HTTP_404_NOT_FOUND,
                    error_code='NOT_FOUND'
                )
        except Exception as e:
            return error_response(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code='VALIDATION_ERROR'
            )
