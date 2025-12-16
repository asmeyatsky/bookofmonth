from django.urls import path, include
from rest_framework import routers
from .views import (
    UserViewSet, BookmarkViewSet, ReadingProgressViewSet, ChildProfileViewSet,
    ReadingStreakViewSet, AchievementViewSet, UserAchievementViewSet,
    RegisterView, LoginView, LogoutView
)

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'bookmarks', BookmarkViewSet)
router.register(r'reading-progress', ReadingProgressViewSet)
router.register(r'child-profiles', ChildProfileViewSet)
router.register(r'reading-streaks', ReadingStreakViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'user-achievements', UserAchievementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
