"""
Custom middleware for security headers and other cross-cutting concerns.
"""
from django.conf import settings


class ContentSecurityPolicyMiddleware:
    """
    Middleware to add Content-Security-Policy headers to responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only add CSP headers in production
        if not settings.DEBUG:
            csp_parts = []

            # Build CSP directives from settings
            if hasattr(settings, 'CSP_DEFAULT_SRC'):
                csp_parts.append(f"default-src {' '.join(settings.CSP_DEFAULT_SRC)}")

            if hasattr(settings, 'CSP_SCRIPT_SRC'):
                csp_parts.append(f"script-src {' '.join(settings.CSP_SCRIPT_SRC)}")

            if hasattr(settings, 'CSP_STYLE_SRC'):
                csp_parts.append(f"style-src {' '.join(settings.CSP_STYLE_SRC)}")

            if hasattr(settings, 'CSP_IMG_SRC'):
                csp_parts.append(f"img-src {' '.join(settings.CSP_IMG_SRC)}")

            if hasattr(settings, 'CSP_FONT_SRC'):
                csp_parts.append(f"font-src {' '.join(settings.CSP_FONT_SRC)}")

            if hasattr(settings, 'CSP_CONNECT_SRC'):
                csp_parts.append(f"connect-src {' '.join(settings.CSP_CONNECT_SRC)}")

            if hasattr(settings, 'CSP_FRAME_ANCESTORS'):
                csp_parts.append(f"frame-ancestors {' '.join(settings.CSP_FRAME_ANCESTORS)}")

            if hasattr(settings, 'CSP_FORM_ACTION'):
                csp_parts.append(f"form-action {' '.join(settings.CSP_FORM_ACTION)}")

            if csp_parts:
                response['Content-Security-Policy'] = '; '.join(csp_parts)

            # Add Permissions-Policy header
            if hasattr(settings, 'PERMISSIONS_POLICY'):
                permissions = []
                for feature, values in settings.PERMISSIONS_POLICY.items():
                    if values:
                        permissions.append(f"{feature}=({' '.join(values)})")
                    else:
                        permissions.append(f"{feature}=()")
                if permissions:
                    response['Permissions-Policy'] = ', '.join(permissions)

            # Add Referrer-Policy if set
            if hasattr(settings, 'SECURE_REFERRER_POLICY'):
                response['Referrer-Policy'] = settings.SECURE_REFERRER_POLICY

        return response


class RequestLoggingMiddleware:
    """
    Middleware to log request information for debugging and monitoring.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        import logging
        import time

        logger = logging.getLogger('django.request')

        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        # Log request details
        if settings.DEBUG or duration > 1.0:  # Log slow requests
            logger.info(
                f"{request.method} {request.path} - "
                f"Status: {response.status_code} - "
                f"Duration: {duration:.3f}s"
            )

        return response
