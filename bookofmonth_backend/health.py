"""
Health check endpoint for monitoring and container orchestration.
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import time


def health_check(request):
    """
    Health check endpoint that verifies:
    - Database connectivity
    - Redis/Cache connectivity
    - Basic application status

    Returns 200 if healthy, 503 if any component is unhealthy.
    """
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'checks': {}
    }

    is_healthy = True

    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        health_status['checks']['database'] = {'status': 'healthy'}
    except Exception as e:
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        is_healthy = False

    # Check Redis/Cache connectivity
    try:
        cache.set('health_check', 'ok', timeout=10)
        if cache.get('health_check') == 'ok':
            health_status['checks']['cache'] = {'status': 'healthy'}
        else:
            health_status['checks']['cache'] = {
                'status': 'unhealthy',
                'error': 'Cache read/write failed'
            }
            is_healthy = False
    except Exception as e:
        health_status['checks']['cache'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        is_healthy = False

    if not is_healthy:
        health_status['status'] = 'unhealthy'
        return JsonResponse(health_status, status=503)

    return JsonResponse(health_status, status=200)


def readiness_check(request):
    """
    Readiness check - indicates if the app is ready to receive traffic.
    More comprehensive than liveness check.
    """
    return health_check(request)


def liveness_check(request):
    """
    Liveness check - simple check to see if the app is running.
    Used by Kubernetes/orchestrators to detect hung processes.
    """
    return JsonResponse({
        'status': 'alive',
        'timestamp': time.time()
    }, status=200)
