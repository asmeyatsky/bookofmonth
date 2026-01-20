"""
API versioning configuration for Book of the Month.

This module provides API versioning support through URL path versioning.
Example: /api/v1/content/news-events/

Usage in urls.py:
    from bookofmonth_backend.api_versioning import versioned_url_patterns

    urlpatterns = [
        path('api/', include(versioned_url_patterns)),
    ]
"""
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response


# API version configuration
API_VERSION = 'v1'
SUPPORTED_VERSIONS = ['v1']
DEFAULT_VERSION = 'v1'


def get_versioned_url_patterns():
    """
    Generate versioned URL patterns.

    Returns URL patterns for all supported API versions.
    """
    from content_pipeline.urls import urlpatterns as content_urls
    from book_assembly.urls import urlpatterns as assembly_urls
    from users.urls import urlpatterns as users_urls
    from quizzes.urls import urlpatterns as quizzes_urls

    versioned_patterns = []

    for version in SUPPORTED_VERSIONS:
        versioned_patterns.extend([
            path(f'{version}/content/', include(content_urls)),
            path(f'{version}/assembly/', include(assembly_urls)),
            path(f'{version}/users/', include(users_urls)),
            path(f'{version}/quizzes/', include(quizzes_urls)),
        ])

    return versioned_patterns


@api_view(['GET'])
def api_root(request):
    """
    API root endpoint that lists available versions and endpoints.
    """
    return Response({
        'name': 'Book of the Month API',
        'current_version': API_VERSION,
        'supported_versions': SUPPORTED_VERSIONS,
        'endpoints': {
            'content': f'/api/{API_VERSION}/content/',
            'assembly': f'/api/{API_VERSION}/assembly/',
            'users': f'/api/{API_VERSION}/users/',
            'quizzes': f'/api/{API_VERSION}/quizzes/',
            'health': '/api/health/',
        },
        'documentation': {
            'swagger': '/swagger/',
            'redoc': '/redoc/',
        }
    })


class APIVersionMiddleware:
    """
    Middleware to handle API version headers and deprecation warnings.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add API version header to responses
        if request.path.startswith('/api/'):
            response['X-API-Version'] = API_VERSION

            # Add deprecation warning for old versions
            if '/api/v0/' in request.path:
                response['X-API-Deprecated'] = 'true'
                response['X-API-Deprecation-Message'] = (
                    'This API version is deprecated. Please migrate to v1.'
                )

        return response
