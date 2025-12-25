from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import CustomUser, Bookmark, ReadingProgress, ChildProfile, ReadingStreak, Achievement, UserAchievement
from .services import AchievementService
from .serializers import (
    UserSerializer, BookmarkSerializer, ReadingProgressSerializer,
    ChildProfileSerializer, ReadingStreakSerializer, AchievementSerializer,
    UserAchievementSerializer, LoginSerializer, RegisterSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer, ChangePasswordSerializer
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
        
        response = super().update(request, *args, **kwargs)
        
        # If marked as complete, trigger achievement checks
        if request.data.get('completed') and not instance.completed:
            AchievementService.mark_content_complete(request.user, instance.news_event)
        
        return response


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
    
    @action(detail=False, methods=['post'])
    def update_streak(self, request):
        """Manually update reading streak for the user."""
        streak = AchievementService.update_reading_streak(request.user)
        serializer = self.get_serializer(streak)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_content_complete(self, request):
        """Mark content as complete and trigger achievement checks."""
        news_event_id = request.data.get('news_event_id')
        if not news_event_id:
            return Response(
                {'error': 'news_event_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            news_event = NewsEventModel.objects.get(id=news_event_id)
            AchievementService.mark_content_complete(request.user, news_event)
            return Response({'message': 'Content marked as complete'})
        except NewsEventModel.DoesNotExist:
            return Response(
                {'error': 'News event not found'},
                status=status.HTTP_404_NOT_FOUND
            )


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


class PasswordResetRequestView(APIView):
    """Request a password reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_url = f"{request.build_absolute_uri('/').rstrip('/')}/reset-password/{uid}/{token}/"

        send_mail(
            subject='Password Reset Request - Book of the Month',
            message=f'''
Hi {user.username},

You requested a password reset for your Book of the Month account.

Click the link below to reset your password:
{reset_url}

If you didn't request this, please ignore this email.

Best regards,
The Book of the Month Team
            ''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({
            'message': 'Password reset email sent successfully.'
        })


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']

        # Token format: uid-token
        try:
            uid_token = token.split('-', 1)
            if len(uid_token) != 2:
                return Response(
                    {'error': 'Invalid token format'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            uid, actual_token = uid_token
            user_id = force_str(urlsafe_base64_decode(uid))
            user = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, CustomUser.DoesNotExist):
            return Response(
                {'error': 'Invalid reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, actual_token):
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['password'])
        user.save()

        return Response({
            'message': 'Password reset successfully.'
        })


class ChangePasswordView(APIView):
    """Change password for authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Invalidate old token and create a new one
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({
            'message': 'Password changed successfully.',
            'token': new_token.key
        })
