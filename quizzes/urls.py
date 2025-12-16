from django.urls import path, include
from rest_framework import routers
from .views import QuizViewSet, QuestionViewSet

router = routers.DefaultRouter()
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
