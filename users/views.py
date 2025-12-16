from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from .models import CustomUser, Bookmark, ReadingProgress, ChildProfile, ReadingStreak, Achievement, UserAchievement
from .serializers import (
    UserSerializer, BookmarkSerializer, ReadingProgressSerializer,
    ChildProfileSerializer, ReadingStreakSerializer, AchievementSerializer,
    UserAchievementSerializer, LoginSerializer, RegisterSerializer
)
from content_pipeline.models import NewsEventModel


class RegisterView(generics.CreateAPIView):
    """User registration endpoint - no authentication required."""
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint - no authentication required."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'User account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })


class LogoutView(APIView):
    """User logout endpoint - deletes auth token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """
    User management viewset.
    - List/Retrieve: Admin only
    - Create: Not allowed (use /register instead)
    - Update/Delete: Owner or Admin only
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAdminUser]
        elif self.action == 'create':
            permission_classes = [permissions.IsAdminUser]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'me':
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You can only update your own profile'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You can only delete your own account'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user's profile."""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class BookmarkViewSet(viewsets.ModelViewSet):
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        news_event_id = request.data.get('news_event_id')
        if not news_event_id:
            return Response(
                {'news_event_id': 'This field is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not NewsEventModel.objects.filter(id=news_event_id).exists():
            return Response(
                {'news_event_id': 'News event not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check if bookmark already exists
        if Bookmark.objects.filter(user=request.user, news_event_id=news_event_id).exists():
            return Response(
                {'error': 'Bookmark already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only delete your own bookmarks'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ReadingProgressViewSet(viewsets.ModelViewSet):
    queryset = ReadingProgress.objects.all()
    serializer_class = ReadingProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['news_event', 'completed']

    def get_queryset(self):
        queryset = self.queryset.filter(user=self.request.user)
        news_event_id = self.request.query_params.get('news_event_id')
        if news_event_id:
            queryset = queryset.filter(news_event_id=news_event_id)
        return queryset

    def create(self, request, *args, **kwargs):
        news_event_id = request.data.get('news_event_id')
        if not news_event_id:
            return Response(
                {'news_event_id': 'This field is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not NewsEventModel.objects.filter(id=news_event_id).exists():
            return Response(
                {'news_event_id': 'News event not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only update your own reading progress'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)


class ChildProfileViewSet(viewsets.ModelViewSet):
    queryset = ChildProfile.objects.all()
    serializer_class = ChildProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only update your own child profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You can only delete your own child profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ReadingStreakViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadingStreak.objects.all()
    serializer_class = ReadingStreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """Achievement definitions - read only, authenticated users only."""
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserAchievement.objects.all()
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
