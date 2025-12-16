from django.urls import path, include
from rest_framework import routers
from .views import UserViewSet, BookmarkViewSet, ReadingProgressViewSet, ChildProfileViewSet, ReadingStreakViewSet, AchievementViewSet, UserAchievementViewSet # Import new ViewSets

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'bookmarks', BookmarkViewSet)
router.register(r'reading-progress', ReadingProgressViewSet)
router.register(r'child-profiles', ChildProfileViewSet)
router.register(r'reading-streaks', ReadingStreakViewSet) # Register ReadingStreakViewSet
router.register(r'achievements', AchievementViewSet) # Register AchievementViewSet
router.register(r'user-achievements', UserAchievementViewSet) # Register UserAchievementViewSet

urlpatterns = [
    path('', include(router.urls)),
]
