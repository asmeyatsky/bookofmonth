# API Documentation Configuration

from rest_framework import permissions
from django.urls import path
from users.views import (
    RegisterView, LoginView, LogoutView, UserViewSet,
    BookmarkViewSet, ReadingProgressViewSet, ChildProfileViewSet,
    ReadingStreakViewSet, AchievementViewSet, UserAchievementViewSet
)
from quizzes.views import QuizViewSet, QuestionViewSet, QuizSubmissionViewSet
from content_pipeline.views import NewsEventViewSet


info = openapi.Info(
    title="Book of the Month API",
    default_version='v1',
    description="""
    ## Book of the Month API Documentation
    
    This API provides access to age-appropriate news content, reading progress tracking,
    achievements, quizzes, and user management for the Book of the Month platform.
    
    ### Authentication
    Most endpoints require Token-based authentication. Include the token in the Authorization header:
    
    ```
    Authorization: Token your-api-token-here
    ```
    
    ### Key Features
    - **User Management**: Registration, authentication, profile management
    - **Content Pipeline**: Age-appropriate news content processing and delivery
    - **Reading Progress**: Track reading history and progress
    - **Achievements**: Earn badges and maintain reading streaks
    - **Quizzes**: Test knowledge with monthly quizzes
    - **Book Assembly**: Automated monthly book generation
    - **Child Profiles**: Multiple profiles per family account
    
    ### Error Handling
    All API responses follow a consistent format:
    
    **Success Response:**
    ```json
    {
        "success": true,
        "data": {...},
        "message": "Operation completed successfully"
    }
    ```
    
    **Error Response:**
    ```json
    {
        "success": false,
        "error": {
            "message": "Error description",
            "code": "ERROR_CODE",
            "details": {...}
        }
    }
    ```
    
    ### Rate Limiting
    - Anonymous users: 100 requests per hour
    - Authenticated users: 1000 requests per hour
    
    ### Pagination
    List endpoints support pagination:
    
    ```json
    {
        "success": true,
        "data": [...],
        "pagination": {
            "count": 150,
            "next": "https://api.example.com/items/?page=3",
            "previous": "https://api.example.com/items/?page=1",
            "page_size": 20
        }
    }
    ```
    
    For detailed endpoint documentation, see the sections below.
    """,
    terms_of_service="https://bookofmonth.com/terms",
    contact=openapi.Contact(email="support@bookofmonth.com"),
    license=openapi.License(name="MIT"),
)

server_urls = [
    openapi.Server(
        url="http://localhost:8000/api",
        description="Development server"
    ),
    openapi.Server(
        url="https://api.bookofmonth.com/api",
        description="Production server"
    ),
]

# Security definitions for token authentication
security_scheme = openapi.ApiKeyAuthorization(
    name='Token',
    in_=openapi.IN_HEADER,
    description='Token-based authentication. Format: Token <your-token>'
)

# Define security requirements
security = [security_scheme]


@swagger_auto_schema(
    operation_id='user_register',
    tags=['Authentication'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Unique username'),
            'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL, description='Valid email address'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, min_length=8, description='Password (min 8 characters)'),
        },
        required=['username', 'email', 'password']
    ),
    responses={
        201: openapi.Response(
            description='User registered successfully',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    'data': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                            'token': openapi.Schema(type=openapi.TYPE_STRING),
                        }
                    )
                }
            )
        ),
        400: openapi.Response(description='Validation error'),
    }
)
def register_schema():
    pass  # Schema defined in decorator


@swagger_auto_schema(
    operation_id='user_login',
    tags=['Authentication'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password'),
        },
        required=['username', 'password']
    ),
    responses={
        200: openapi.Response(
            description='Login successful',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                    'data': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                            'token': openapi.Schema(type=openapi.TYPE_STRING),
                        }
                    )
                }
            )
        ),
        401: openapi.Response(description='Invalid credentials'),
    }
)
def login_schema():
    pass


# Public endpoints (no authentication required)
public_patterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='user-register'),
    path('auth/login/', LoginView.as_view(), name='user-login'),
    # Content
    path('news/', NewsEventViewSet.as_view({'get': 'list'}), name='news-list'),
    path('news/<uuid:pk>/', NewsEventViewSet.as_view({'get': 'retrieve'}), name='news-detail'),
    # Quizzes (read-only)
    path('quizzes/', QuizViewSet.as_view({'get': 'list'}), name='quiz-list'),
    path('quizzes/<uuid:pk>/', QuizViewSet.as_view({'get': 'retrieve'}), name='quiz-detail'),
    path('questions/', QuestionViewSet.as_view({'get': 'list'}), name='question-list'),
    path('questions/<uuid:pk>/', QuestionViewSet.as_view({'get': 'retrieve'}), name='question-detail'),
]

# Protected endpoints (authentication required)
protected_patterns = [
    # User management
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user-me'),
    path('users/', UserViewSet.as_view({'get': 'list', 'post': 'create'}), name='user-list'),
    # Reading progress
    path('progress/', ReadingProgressViewSet.as_view({'get': 'list', 'post': 'create'}), name='readingprogress-list'),
    path('progress/<uuid:pk>/', ReadingProgressViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='readingprogress-detail'),
    # Bookmarks
    path('bookmarks/', BookmarkViewSet.as_view({'get': 'list', 'post': 'create'}), name='bookmark-list'),
    path('bookmarks/<uuid:pk>/', BookmarkViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='bookmark-detail'),
    # Child profiles
    path('children/', ChildProfileViewSet.as_view({'get': 'list', 'post': 'create'}), name='childprofile-list'),
    path('children/<int:pk>/', ChildProfileViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='childprofile-detail'),
    # Reading streaks and achievements
    path('streaks/', ReadingStreakViewSet.as_view({'get': 'list', 'post': 'create'}), name='readingstreak-list'),
    path('streaks/update/', ReadingStreakViewSet.as_view({'post': 'update_streak'}), name='readingstreak-update-streak'),
    path('achievements/', AchievementViewSet.as_view({'get': 'list'}), name='achievement-list'),
    path('my-achievements/', UserAchievementViewSet.as_view({'get': 'list'}), name='userachievement-list'),
    # Quiz submissions
    path('quiz-submissions/', QuizSubmissionViewSet.as_view({'get': 'list', 'post': 'create'}), name='quizsubmission-list'),
    path('quiz-submissions/by-quiz/', QuizSubmissionViewSet.as_view({'get': 'by_quiz'}), name='quizsubmission-by-quiz'),
]

# URL patterns for API documentation
urlpatterns = [
    path('public/', include(public_patterns)),
    path('protected/', include(protected_patterns)),
]