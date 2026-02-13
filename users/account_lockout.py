"""
Account lockout functionality to prevent brute force attacks.
"""
from datetime import timedelta
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

# Configuration defaults
MAX_FAILED_ATTEMPTS = getattr(settings, 'MAX_FAILED_LOGIN_ATTEMPTS', 5)
LOCKOUT_DURATION_MINUTES = getattr(settings, 'LOCKOUT_DURATION_MINUTES', 15)


def get_lockout_cache_key(username_or_ip):
    """Generate cache key for lockout tracking."""
    return f"account_lockout:{username_or_ip}"


def get_failed_attempts_cache_key(username_or_ip):
    """Generate cache key for failed attempts tracking."""
    return f"failed_login_attempts:{username_or_ip}"


def is_account_locked(username_or_ip):
    """
    Check if an account is currently locked.

    Args:
        username_or_ip: Username or IP address to check

    Returns:
        tuple: (is_locked, remaining_seconds)
    """
    try:
        lockout_key = get_lockout_cache_key(username_or_ip)
        lockout_until = cache.get(lockout_key)

        if lockout_until:
            remaining = (lockout_until - timezone.now()).total_seconds()
            if remaining > 0:
                return True, int(remaining)
            else:
                # Lockout has expired, clean up
                cache.delete(lockout_key)
                cache.delete(get_failed_attempts_cache_key(username_or_ip))
    except Exception:
        pass

    return False, 0


def record_failed_attempt(username_or_ip):
    """
    Record a failed login attempt.

    Args:
        username_or_ip: Username or IP address

    Returns:
        tuple: (attempts_count, is_now_locked, lockout_seconds)
    """
    try:
        attempts_key = get_failed_attempts_cache_key(username_or_ip)

        # Get current attempts count
        attempts = cache.get(attempts_key, 0)
        attempts += 1

        # Store with expiration slightly longer than lockout duration
        cache_timeout = LOCKOUT_DURATION_MINUTES * 60 + 60
        cache.set(attempts_key, attempts, timeout=cache_timeout)

        # Check if we should lock the account
        if attempts >= MAX_FAILED_ATTEMPTS:
            lockout_key = get_lockout_cache_key(username_or_ip)
            lockout_until = timezone.now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            cache.set(lockout_key, lockout_until, timeout=LOCKOUT_DURATION_MINUTES * 60)
            return attempts, True, LOCKOUT_DURATION_MINUTES * 60

        return attempts, False, 0
    except Exception:
        return 1, False, 0


def reset_failed_attempts(username_or_ip):
    """
    Reset failed attempts counter after successful login.

    Args:
        username_or_ip: Username or IP address
    """
    try:
        cache.delete(get_failed_attempts_cache_key(username_or_ip))
        cache.delete(get_lockout_cache_key(username_or_ip))
    except Exception:
        pass


def get_remaining_attempts(username_or_ip):
    """
    Get the number of remaining login attempts before lockout.

    Args:
        username_or_ip: Username or IP address

    Returns:
        int: Number of remaining attempts
    """
    try:
        attempts_key = get_failed_attempts_cache_key(username_or_ip)
        attempts = cache.get(attempts_key, 0)
        return max(0, MAX_FAILED_ATTEMPTS - attempts)
    except Exception:
        return MAX_FAILED_ATTEMPTS


def get_client_ip(request):
    """
    Get the client's IP address from the request.
    Handles proxied requests (X-Forwarded-For).

    Args:
        request: Django request object

    Returns:
        str: Client IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
