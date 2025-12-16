from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import CustomUser, Bookmark, ReadingProgress, ChildProfile, ReadingStreak, Achievement, UserAchievement
from .serializers import UserSerializer, BookmarkSerializer, ReadingProgressSerializer, ChildProfileSerializer, ReadingStreakSerializer, AchievementSerializer, UserAchievementSerializer
from content_pipeline.models import NewsEventModel

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

class BookmarkViewSet(viewsets.ModelViewSet):
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        news_event_id = self.request.data.get('news_event_id')
        if not NewsEventModel.objects.filter(id=news_event_id).exists():
            return Response({"news_event_id": "News event not found."}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        instance.delete()

class ReadingProgressViewSet(viewsets.ModelViewSet):
    queryset = ReadingProgress.objects.all()
    serializer_class = ReadingProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        news_event_id = self.request.data.get('news_event_id')
        if not NewsEventModel.objects.filter(id=news_event_id).exists():
            return Response({"news_event_id": "News event not found."}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(user=self.request.user)

class ChildProfileViewSet(viewsets.ModelViewSet):
    queryset = ChildProfile.objects.all()
    serializer_class = ChildProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ReadingStreakViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadingStreak.objects.all()
    serializer_class = ReadingStreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserAchievement.objects.all()
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
