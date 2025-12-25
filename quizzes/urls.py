from django.urls import path, include
from rest_framework import routers
from .views import QuizViewSet, QuestionViewSet, QuizSubmissionViewSet

router = routers.DefaultRouter()
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'submissions', QuizSubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
