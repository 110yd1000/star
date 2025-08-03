from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class CustomUserRateThrottle(UserRateThrottle):
    rate = '1000/hour'


class AuthenticationRateThrottle(AnonRateThrottle):
    """Rate limiting for authentication endpoints"""
    scope = 'authentication'
    rate = '5/minute'


class PasswordResetRateThrottle(AnonRateThrottle):
    """Rate limiting for password reset endpoints"""
    scope = 'password_reset'
    rate = '3/hour'


class OTPVerificationRateThrottle(AnonRateThrottle):
    """Rate limiting for OTP verification endpoints"""
    scope = 'otp_verification'
    rate = '10/hour'