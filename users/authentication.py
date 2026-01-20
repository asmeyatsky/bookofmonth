"""
Custom authentication with token expiration support.
"""
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authtoken.models import Token


# Token expiration time (default 30 days)
TOKEN_EXPIRATION_DAYS = getattr(settings, 'TOKEN_EXPIRATION_DAYS', 30)


class ExpiringTokenAuthentication(TokenAuthentication):
    """
    Token authentication with expiration support.

    Tokens expire after TOKEN_EXPIRATION_DAYS (default 30 days).
    When a token expires, the user must re-authenticate.
    """

    def authenticate_credentials(self, key):
        """
        Authenticate the token and check if it has expired.
        """
        try:
            token = Token.objects.select_related('user').get(key=key)
        except Token.DoesNotExist:
            raise AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise AuthenticationFailed('User inactive or deleted.')

        # Check token expiration
        if self.is_token_expired(token):
            token.delete()
            raise AuthenticationFailed('Token has expired. Please login again.')

        return (token.user, token)

    def is_token_expired(self, token):
        """
        Check if a token has expired.
        """
        expiration_time = token.created + timedelta(days=TOKEN_EXPIRATION_DAYS)
        return timezone.now() > expiration_time


def get_token_expiration_time(token):
    """
    Get the expiration time for a token.
    """
    return token.created + timedelta(days=TOKEN_EXPIRATION_DAYS)


def get_token_remaining_time(token):
    """
    Get the remaining time until token expiration.
    """
    expiration_time = get_token_expiration_time(token)
    remaining = expiration_time - timezone.now()
    return max(remaining, timedelta(0))


def refresh_token(user):
    """
    Delete old token and create a new one.
    Returns the new token.
    """
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)
