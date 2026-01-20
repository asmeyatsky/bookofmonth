"""
MFA-related API views.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from .mfa import (
    generate_qr_code,
    get_totp_secret,
    enable_mfa,
    disable_mfa,
    is_mfa_enabled,
    verify_totp_token,
    generate_backup_codes
)


class MFASetupSerializer(serializers.Serializer):
    """Serializer for MFA verification."""
    token = serializers.CharField(min_length=6, max_length=6)


class MFAStatusView(APIView):
    """Check MFA status for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'mfa_enabled': is_mfa_enabled(request.user)
        })


class MFASetupView(APIView):
    """
    Set up MFA for the authenticated user.

    GET: Get QR code and secret for TOTP setup
    POST: Verify and enable MFA
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get QR code and secret for setting up MFA."""
        if is_mfa_enabled(request.user):
            return Response(
                {'error': 'MFA is already enabled for this account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        qr_code = generate_qr_code(request.user)
        secret = get_totp_secret(request.user)

        return Response({
            'qr_code': qr_code,
            'secret': secret,
            'instructions': (
                '1. Scan the QR code with your authenticator app '
                '(Google Authenticator, Authy, etc.)\n'
                '2. Or manually enter the secret key\n'
                '3. Enter the 6-digit code to verify and enable MFA'
            )
        })

    def post(self, request):
        """Verify token and enable MFA."""
        serializer = MFASetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        success, message = enable_mfa(request.user, token)

        if success:
            # Generate backup codes
            backup_codes = generate_backup_codes(request.user)
            return Response({
                'message': message,
                'backup_codes': backup_codes,
                'warning': (
                    'Save these backup codes in a secure place. '
                    'You can use them to access your account if you lose '
                    'access to your authenticator app. Each code can only be used once.'
                )
            })

        return Response(
            {'error': message},
            status=status.HTTP_400_BAD_REQUEST
        )


class MFADisableView(APIView):
    """Disable MFA for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Disable MFA after verifying the token."""
        serializer = MFASetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        success, message = disable_mfa(request.user, token)

        if success:
            return Response({'message': message})

        return Response(
            {'error': message},
            status=status.HTTP_400_BAD_REQUEST
        )


class MFAVerifyView(APIView):
    """Verify MFA token during login."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Verify MFA token."""
        serializer = MFASetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']

        if verify_totp_token(request.user, token):
            return Response({
                'message': 'MFA verification successful.',
                'verified': True
            })

        return Response(
            {
                'error': 'Invalid verification code.',
                'verified': False
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class MFABackupCodesView(APIView):
    """Regenerate backup codes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Regenerate backup codes after verifying MFA token."""
        if not is_mfa_enabled(request.user):
            return Response(
                {'error': 'MFA is not enabled for this account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = MFASetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']

        if not verify_totp_token(request.user, token):
            return Response(
                {'error': 'Invalid verification code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        backup_codes = generate_backup_codes(request.user)
        return Response({
            'backup_codes': backup_codes,
            'warning': (
                'Your previous backup codes have been invalidated. '
                'Save these new codes in a secure place.'
            )
        })
