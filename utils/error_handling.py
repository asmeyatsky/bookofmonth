from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from django.http import Http404
from django.core.exceptions import PermissionDenied, ValidationError
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base API error class."""
    def __init__(self, message, status_code=status.HTTP_400_BAD_REQUEST, error_code=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)


class NotFoundError(APIError):
    """Resource not found error."""
    def __init__(self, message="Resource not found", error_code="NOT_FOUND"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, error_code)


class PermissionError(APIError):
    """Permission denied error."""
    def __init__(self, message="Permission denied", error_code="PERMISSION_DENIED"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, error_code)


class AuthenticationError(APIError):
    """Authentication error."""
    def __init__(self, message="Authentication failed", error_code="AUTHENTICATION_FAILED"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, error_code)


class ValidationError(APIError):
    """Validation error."""
    def __init__(self, message="Validation failed", error_code="VALIDATION_ERROR"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, error_code)


class RateLimitError(APIError):
    """Rate limit error."""
    def __init__(self, message="Rate limit exceeded", error_code="RATE_LIMIT_EXCEEDED"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, error_code)


class ServiceUnavailableError(APIError):
    """Service unavailable error."""
    def __init__(self, message="Service temporarily unavailable", error_code="SERVICE_UNAVAILABLE"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, error_code)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    """
    # Call DRF's default exception handler first
    response = exception_handler(exc, context)
    
    # If DRF couldn't handle the exception, create a standard error response
    if response is None:
        if isinstance(exc, Http404):
            return error_response(
                message="The requested resource was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                error_code="NOT_FOUND"
            )
        elif isinstance(exc, PermissionDenied):
            return error_response(
                message="You do not have permission to perform this action.",
                status_code=status.HTTP_403_FORBIDDEN,
                error_code="PERMISSION_DENIED"
            )
        elif isinstance(exc, ValidationError):
            return error_response(
                message=str(exc),
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code="VALIDATION_ERROR"
            )
        elif isinstance(exc, APIError):
            return error_response(
                message=exc.message,
                status_code=exc.status_code,
                error_code=exc.error_code
            )
        else:
            # Log unexpected errors
            logger.error(f"Unexpected error: {exc}", exc_info=True)
            return error_response(
                message="An unexpected error occurred.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                error_code="INTERNAL_SERVER_ERROR"
            )
    
    # Enhance DRF's error response with our standard format
    if response is not None:
        custom_response_data = {
            'success': False,
            'error': {
                'message': response.data.get('detail', 'Validation error'),
                'code': 'VALIDATION_ERROR',
                'details': response.data if isinstance(response.data, dict) else {}
            }
        }
        
        # Preserve status code
        response.data = custom_response_data
        return response
    
    return response


def error_response(message, status_code=status.HTTP_400_BAD_REQUEST, error_code=None, details=None):
    """
    Create a standardized error response.
    """
    response_data = {
        'success': False,
        'error': {
            'message': message,
            'code': error_code or 'UNKNOWN_ERROR'
        }
    }
    
    if details:
        response_data['error']['details'] = details
    
    return Response(response_data, status=status_code)


def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """
    Create a standardized success response.
    """
    response_data = {
        'success': True,
        'data': data
    }
    
    if message:
        response_data['message'] = message
    
    return Response(response_data, status=status_code)


def paginated_response(queryset, serializer_class, request, message=None):
    """
    Create a paginated response.
    """
    from rest_framework.pagination import PageNumberPagination
    
    paginator = PageNumberPagination()
    paginator.page_size = 20
    result_page = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(result_page, many=True)
    
    response_data = {
        'success': True,
        'data': serializer.data,
        'pagination': {
            'count': paginator.page.paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'page_size': paginator.page_size
        }
    }
    
    if message:
        response_data['message'] = message
    
    return paginator.get_paginated_response(response_data['data'])


def validate_required_fields(data, required_fields):
    """
    Validate that required fields are present in data.
    """
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)
    
    if missing_fields:
        raise ValidationError(
            message=f"Missing required fields: {', '.join(missing_fields)}",
            error_code="MISSING_FIELDS"
        )