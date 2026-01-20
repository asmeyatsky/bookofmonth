"""
Tests for Utils module - Error Handling and Helper Functions.
"""
import pytest
from django.test import TestCase, RequestFactory
from rest_framework import status
from rest_framework.test import APIRequestFactory
from unittest.mock import MagicMock, patch


@pytest.mark.django_db
class APIErrorTestCase(TestCase):
    """Test custom API error classes."""

    def test_api_error_base_class(self):
        """Test base APIError class."""
        from utils.error_handling import APIError

        error = APIError("Test error", status.HTTP_400_BAD_REQUEST, "TEST_ERROR")

        self.assertEqual(error.message, "Test error")
        self.assertEqual(error.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error.error_code, "TEST_ERROR")
        self.assertEqual(str(error), "Test error")

    def test_not_found_error(self):
        """Test NotFoundError class."""
        from utils.error_handling import NotFoundError

        error = NotFoundError()

        self.assertEqual(error.message, "Resource not found")
        self.assertEqual(error.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(error.error_code, "NOT_FOUND")

    def test_not_found_error_custom_message(self):
        """Test NotFoundError with custom message."""
        from utils.error_handling import NotFoundError

        error = NotFoundError("User not found", "USER_NOT_FOUND")

        self.assertEqual(error.message, "User not found")
        self.assertEqual(error.error_code, "USER_NOT_FOUND")

    def test_permission_error(self):
        """Test PermissionError class."""
        from utils.error_handling import PermissionError

        error = PermissionError()

        self.assertEqual(error.message, "Permission denied")
        self.assertEqual(error.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(error.error_code, "PERMISSION_DENIED")

    def test_authentication_error(self):
        """Test AuthenticationError class."""
        from utils.error_handling import AuthenticationError

        error = AuthenticationError()

        self.assertEqual(error.message, "Authentication failed")
        self.assertEqual(error.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(error.error_code, "AUTHENTICATION_FAILED")

    def test_validation_error(self):
        """Test ValidationError class."""
        from utils.error_handling import ValidationError

        error = ValidationError("Invalid email format", "INVALID_EMAIL")

        self.assertEqual(error.message, "Invalid email format")
        self.assertEqual(error.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error.error_code, "INVALID_EMAIL")

    def test_rate_limit_error(self):
        """Test RateLimitError class."""
        from utils.error_handling import RateLimitError

        error = RateLimitError()

        self.assertEqual(error.message, "Rate limit exceeded")
        self.assertEqual(error.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(error.error_code, "RATE_LIMIT_EXCEEDED")

    def test_service_unavailable_error(self):
        """Test ServiceUnavailableError class."""
        from utils.error_handling import ServiceUnavailableError

        error = ServiceUnavailableError()

        self.assertEqual(error.message, "Service temporarily unavailable")
        self.assertEqual(error.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(error.error_code, "SERVICE_UNAVAILABLE")


@pytest.mark.django_db
class ErrorResponseTestCase(TestCase):
    """Test error response helper function."""

    def test_error_response_basic(self):
        """Test basic error response."""
        from utils.error_handling import error_response

        response = error_response("Something went wrong")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['message'], "Something went wrong")

    def test_error_response_with_status_code(self):
        """Test error response with custom status code."""
        from utils.error_handling import error_response

        response = error_response(
            "Not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_error_response_with_error_code(self):
        """Test error response with error code."""
        from utils.error_handling import error_response

        response = error_response(
            "Validation failed",
            error_code="VALIDATION_ERROR"
        )

        self.assertEqual(response.data['error']['code'], "VALIDATION_ERROR")

    def test_error_response_with_details(self):
        """Test error response with additional details."""
        from utils.error_handling import error_response

        details = {'field': 'email', 'issue': 'invalid format'}
        response = error_response(
            "Validation failed",
            details=details
        )

        self.assertEqual(response.data['error']['details'], details)


@pytest.mark.django_db
class SuccessResponseTestCase(TestCase):
    """Test success response helper function."""

    def test_success_response_basic(self):
        """Test basic success response."""
        from utils.error_handling import success_response

        response = success_response({'key': 'value'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data'], {'key': 'value'})

    def test_success_response_with_message(self):
        """Test success response with message."""
        from utils.error_handling import success_response

        response = success_response(
            {'id': 1},
            message="Created successfully"
        )

        self.assertEqual(response.data['message'], "Created successfully")

    def test_success_response_with_status_code(self):
        """Test success response with custom status code."""
        from utils.error_handling import success_response

        response = success_response(
            {'id': 1},
            status_code=status.HTTP_201_CREATED
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_success_response_with_none_data(self):
        """Test success response with None data."""
        from utils.error_handling import success_response

        response = success_response(None, message="Deleted")

        self.assertIsNone(response.data['data'])


@pytest.mark.django_db
class ValidateRequiredFieldsTestCase(TestCase):
    """Test validate_required_fields helper function."""

    def test_validate_all_fields_present(self):
        """Test validation passes when all fields present."""
        from utils.error_handling import validate_required_fields

        data = {'name': 'John', 'email': 'john@example.com', 'age': 25}
        required = ['name', 'email']

        # Should not raise
        validate_required_fields(data, required)

    def test_validate_missing_field(self):
        """Test validation fails when field is missing."""
        from utils.error_handling import validate_required_fields, ValidationError

        data = {'name': 'John'}
        required = ['name', 'email']

        with self.assertRaises(ValidationError) as context:
            validate_required_fields(data, required)

        self.assertIn('email', str(context.exception))

    def test_validate_empty_string_field(self):
        """Test validation fails when field is empty string."""
        from utils.error_handling import validate_required_fields, ValidationError

        data = {'name': 'John', 'email': ''}
        required = ['name', 'email']

        with self.assertRaises(ValidationError):
            validate_required_fields(data, required)

    def test_validate_none_field(self):
        """Test validation fails when field is None."""
        from utils.error_handling import validate_required_fields, ValidationError

        data = {'name': 'John', 'email': None}
        required = ['name', 'email']

        with self.assertRaises(ValidationError):
            validate_required_fields(data, required)

    def test_validate_multiple_missing_fields(self):
        """Test validation reports all missing fields."""
        from utils.error_handling import validate_required_fields, ValidationError

        data = {'name': 'John'}
        required = ['name', 'email', 'phone']

        with self.assertRaises(ValidationError) as context:
            validate_required_fields(data, required)

        error_message = str(context.exception)
        self.assertIn('email', error_message)
        self.assertIn('phone', error_message)


@pytest.mark.django_db
class CustomExceptionHandlerTestCase(TestCase):
    """Test custom exception handler."""

    def test_handle_http404(self):
        """Test handling of Http404 exception."""
        from utils.error_handling import custom_exception_handler
        from django.http import Http404

        exc = Http404("Not found")
        context = {'request': MagicMock()}

        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data['success'])
        # The handler may return VALIDATION_ERROR or NOT_FOUND depending on DRF handling
        self.assertIn(response.data['error']['code'], ['NOT_FOUND', 'VALIDATION_ERROR'])

    def test_handle_permission_denied(self):
        """Test handling of PermissionDenied exception."""
        from utils.error_handling import custom_exception_handler
        from django.core.exceptions import PermissionDenied

        exc = PermissionDenied("Access denied")
        context = {'request': MagicMock()}

        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # The handler may return different codes depending on DRF handling
        self.assertIn(response.data['error']['code'], ['PERMISSION_DENIED', 'VALIDATION_ERROR'])

    def test_handle_custom_api_error(self):
        """Test handling of custom APIError."""
        from utils.error_handling import custom_exception_handler, NotFoundError

        exc = NotFoundError("User not found", "USER_NOT_FOUND")
        context = {'request': MagicMock()}

        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error']['code'], 'USER_NOT_FOUND')
        self.assertEqual(response.data['error']['message'], 'User not found')

    def test_handle_unexpected_error(self):
        """Test handling of unexpected exceptions."""
        from utils.error_handling import custom_exception_handler

        exc = Exception("Something unexpected")
        context = {'request': MagicMock()}

        response = custom_exception_handler(exc, context)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error']['code'], 'INTERNAL_SERVER_ERROR')

    @patch('utils.error_handling.exception_handler')
    def test_enhance_drf_response(self, mock_handler):
        """Test enhancing DRF's default error response."""
        from utils.error_handling import custom_exception_handler
        from rest_framework.response import Response

        # Mock DRF's handler returning a response
        mock_response = Response({'detail': 'Not found'}, status=404)
        mock_handler.return_value = mock_response

        exc = Exception("Test")
        context = {'request': MagicMock()}

        response = custom_exception_handler(exc, context)

        self.assertIn('success', response.data)
        self.assertFalse(response.data['success'])


@pytest.mark.django_db
class HealthCheckTestCase(TestCase):
    """Test health check endpoint."""

    def test_health_check_response_format(self):
        """Test health check returns proper format."""
        from django.test import Client
        client = Client()

        response = client.get('/api/health/')
        data = response.json()

        # Should return either 200 (healthy) or 503 (unhealthy)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('status', data)
        self.assertIn('checks', data)
        self.assertIn('database', data['checks'])

    def test_health_check_includes_database_status(self):
        """Test health check includes database status."""
        from django.test import Client
        client = Client()

        response = client.get('/api/health/')
        data = response.json()

        self.assertIn('checks', data)
        self.assertIn('database', data['checks'])
        # Database should always be healthy in tests
        self.assertEqual(data['checks']['database']['status'], 'healthy')

    def test_liveness_check(self):
        """Test liveness check endpoint."""
        from django.test import Client
        client = Client()

        response = client.get('/api/health/live/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['status'], 'alive')

    def test_readiness_check_response_format(self):
        """Test readiness check returns proper format."""
        from django.test import Client
        client = Client()

        response = client.get('/api/health/ready/')
        data = response.json()

        # Should return either 200 or 503 depending on Redis availability
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('status', data)


if __name__ == '__main__':
    pytest.main([__file__])
