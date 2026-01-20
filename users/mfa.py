"""
Multi-Factor Authentication (MFA) support using TOTP.

This module provides TOTP-based MFA for enhanced account security.
"""
import base64
import io
from django.conf import settings
from django.db import models
from django_otp.plugins.otp_totp.models import TOTPDevice
import qrcode


def get_or_create_totp_device(user, confirmed=False):
    """
    Get or create a TOTP device for a user.

    Args:
        user: User instance
        confirmed: Whether the device should be marked as confirmed

    Returns:
        TOTPDevice instance
    """
    device, created = TOTPDevice.objects.get_or_create(
        user=user,
        name='default',
        defaults={'confirmed': confirmed}
    )
    return device, created


def generate_qr_code(user):
    """
    Generate a QR code for TOTP setup.

    Args:
        user: User instance

    Returns:
        Base64 encoded QR code image
    """
    device, _ = get_or_create_totp_device(user)

    # Generate provisioning URI
    issuer = getattr(settings, 'MFA_ISSUER_NAME', 'Book of the Month')
    uri = device.config_url

    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)

    # Generate image
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def get_totp_secret(user):
    """
    Get the TOTP secret for manual entry.

    Args:
        user: User instance

    Returns:
        Base32 encoded secret key
    """
    device, _ = get_or_create_totp_device(user)
    return base64.b32encode(device.bin_key).decode('utf-8')


def verify_totp_token(user, token):
    """
    Verify a TOTP token for a user.

    Args:
        user: User instance
        token: 6-digit TOTP token

    Returns:
        bool: True if token is valid
    """
    try:
        device = TOTPDevice.objects.get(user=user, name='default')
        return device.verify_token(token)
    except TOTPDevice.DoesNotExist:
        return False


def enable_mfa(user, token):
    """
    Enable MFA for a user after verifying the token.

    Args:
        user: User instance
        token: 6-digit TOTP token for verification

    Returns:
        tuple: (success: bool, message: str)
    """
    device, created = get_or_create_totp_device(user)

    if device.confirmed:
        return False, "MFA is already enabled for this account."

    if device.verify_token(token):
        device.confirmed = True
        device.save()
        return True, "MFA has been successfully enabled."

    return False, "Invalid verification code. Please try again."


def disable_mfa(user, token):
    """
    Disable MFA for a user after verifying the token.

    Args:
        user: User instance
        token: 6-digit TOTP token for verification

    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        device = TOTPDevice.objects.get(user=user, name='default')

        if not device.confirmed:
            return False, "MFA is not enabled for this account."

        if device.verify_token(token):
            device.delete()
            return True, "MFA has been successfully disabled."

        return False, "Invalid verification code. Please try again."
    except TOTPDevice.DoesNotExist:
        return False, "MFA is not enabled for this account."


def is_mfa_enabled(user):
    """
    Check if MFA is enabled for a user.

    Args:
        user: User instance

    Returns:
        bool: True if MFA is enabled and confirmed
    """
    try:
        device = TOTPDevice.objects.get(user=user, name='default')
        return device.confirmed
    except TOTPDevice.DoesNotExist:
        return False


def generate_backup_codes(user, count=10):
    """
    Generate backup codes for MFA recovery.

    Args:
        user: User instance
        count: Number of backup codes to generate

    Returns:
        list: List of backup codes
    """
    import secrets

    codes = []
    for _ in range(count):
        code = secrets.token_hex(4).upper()
        formatted_code = f"{code[:4]}-{code[4:]}"
        codes.append(formatted_code)

    # In production, store hashed backup codes in the database
    # For now, just return the codes
    return codes
