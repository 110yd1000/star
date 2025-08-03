from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.conf import settings
import uuid
import logging

from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserProfileUpdateSerializer, PasswordChangeSerializer, PasswordResetSerializer,
    PasswordResetConfirmSerializer, EmailVerificationSerializer, PhoneVerificationSerializer,
    AccountDeactivationSerializer, LoginResponseSerializer, RegistrationResponseSerializer
)
from .services import VerificationService
from .verification_models import PasswordResetToken, BlacklistedToken
from config.throttling import AuthenticationRateThrottle, PasswordResetRateThrottle, OTPVerificationRateThrottle

User = get_user_model()
logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """System health check endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            # Check database connectivity
            User.objects.first()
            db_status = "connected"
        except Exception:
            db_status = "disconnected"
        
        # Check email service (basic check)
        email_status = "connected" if settings.EMAIL_HOST else "not_configured"
        
        # Check SMS service (basic check)
        sms_status = "connected" if settings.TWILIO_ACCOUNT_SID else "not_configured"
        
        health_data = {
            "status": "healthy",
            "timestamp": timezone.now().isoformat(),
            "version": "2.0.0",
            "services": {
                "database": db_status,
                "email": email_status,
                "sms": sms_status
            }
        }
        
        # Return 503 if any critical service is down
        if db_status == "disconnected":
            return Response(
                {
                    "error": {
                        "code": "SERVICE_UNAVAILABLE",
                        "message": "Database connection failed"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        return Response(health_data, status=status.HTTP_200_OK)


class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthenticationRateThrottle]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    
                    # Determine what verification is required
                    verification_required = []
                    verification_service = VerificationService()
                    
                    if user.email:
                        verification_required.append('email')
                        verification_service.send_email_verification(user)
                    
                    if user.phone_number:
                        verification_required.append('phone')
                        verification_service.send_phone_verification(user)
                    
                    response_data = {
                        "message": "User registered successfully. Please verify your email/phone.",
                        "user_id": user.id,
                        "verification_required": verification_required
                    }
                    
                    logger.info(f"User registered successfully: {user.id}")
                    return Response(response_data, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                logger.error(f"Registration failed: {str(e)}")
                return Response(
                    {
                        "error": {
                            "code": "REGISTRATION_FAILED",
                            "message": "Registration failed. Please try again."
                        },
                        "timestamp": timezone.now().isoformat(),
                        "path": request.path,
                        "request_id": str(uuid.uuid4())
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Handle validation errors
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "fields": serializer.errors
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path,
                "request_id": str(uuid.uuid4())
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class UserLoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthenticationRateThrottle]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            response_data = {
                "access": str(access_token),
                "refresh": str(refresh),
                "expires_in": int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
                "user": UserProfileSerializer(user).data
            }
            
            logger.info(f"User logged in successfully: {user.id}")
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(
            {
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password"
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path,
                "request_id": str(uuid.uuid4())
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


class UserLogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response(
                    {
                        "error": {
                            "code": "MISSING_REFRESH_TOKEN",
                            "message": "Refresh token is required"
                        },
                        "timestamp": timezone.now().isoformat(),
                        "path": request.path
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            logger.info(f"User logged out successfully: {request.user.id}")
            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Logout failed: {str(e)}")
            return Response(
                {
                    "error": {
                        "code": "LOGOUT_FAILED",
                        "message": "Invalid or expired token"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_401_UNAUTHORIZED
            )


class CustomTokenRefreshView(TokenRefreshView):
    """Custom token refresh view with proper response format"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Add expires_in to response
            response.data['expires_in'] = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
        
        return response


class PasswordChangeView(APIView):
    """Password change endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            logger.info(f"Password changed successfully for user: {user.id}")
            return Response(
                {"message": "Password changed successfully"},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "fields": serializer.errors
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class PasswordResetView(APIView):
    """Password reset request endpoint"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            phone_or_email = serializer.validated_data['phone_or_email']
            
            try:
                # Find user by email or phone
                if '@' in phone_or_email:
                    user = User.objects.get(email=phone_or_email)
                    delivery_method = 'email'
                else:
                    user = User.objects.get(phone_number=phone_or_email)
                    delivery_method = 'sms'
                
                # Create password reset token
                PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
                reset_token = PasswordResetToken.objects.create(
                    user=user,
                    delivery_method=delivery_method
                )
                
                # Send reset instructions
                verification_service = VerificationService()
                if delivery_method == 'email':
                    verification_service.email_service.send_password_reset_email(user, reset_token)
                else:
                    verification_service.sms_service.send_password_reset_sms(user, reset_token)
                
                return Response(
                    {
                        "message": "Password reset instructions sent",
                        "delivery_method": delivery_method
                    },
                    status=status.HTTP_200_OK
                )
                
            except User.DoesNotExist:
                # Don't reveal if user exists or not
                return Response(
                    {
                        "message": "Password reset instructions sent",
                        "delivery_method": "email" if '@' in phone_or_email else "sms"
                    },
                    status=status.HTTP_200_OK
                )
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input data",
                    "fields": serializer.errors
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class PasswordResetConfirmView(APIView):
    """Password reset confirmation endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            token_string = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                reset_token = PasswordResetToken.objects.get(
                    token=token_string,
                    is_used=False
                )
                
                if not reset_token.is_valid():
                    return Response(
                        {
                            "error": {
                                "code": "INVALID_TOKEN",
                                "message": "Invalid or expired token"
                            },
                            "timestamp": timezone.now().isoformat(),
                            "path": request.path
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Reset password
                user = reset_token.user
                user.set_password(new_password)
                user.save()
                
                # Mark token as used
                reset_token.is_used = True
                reset_token.save()
                
                logger.info(f"Password reset successfully for user: {user.id}")
                return Response(
                    {"message": "Password reset successfully"},
                    status=status.HTTP_200_OK
                )
                
            except PasswordResetToken.DoesNotExist:
                return Response(
                    {
                        "error": {
                            "code": "INVALID_TOKEN",
                            "message": "Invalid or expired token"
                        },
                        "timestamp": timezone.now().isoformat(),
                        "path": request.path
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "fields": serializer.errors
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class EmailVerificationView(APIView):
    """Email verification endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['key']
            verification_service = VerificationService()
            
            success, message = verification_service.verify_email_token(token)
            
            if success:
                return Response(
                    {
                        "message": message,
                        "user": UserProfileSerializer(
                            verification_service.email_service.__class__.objects.get(
                                email_verification_tokens__token=token
                            )
                        ).data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "error": {
                            "code": "VERIFICATION_FAILED",
                            "message": message
                        },
                        "timestamp": timezone.now().isoformat(),
                        "path": request.path
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid verification key"
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class PhoneVerificationView(APIView):
    """Phone verification endpoint"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPVerificationRateThrottle]
    
    def post(self, request):
        serializer = PhoneVerificationSerializer(data=request.data)
        
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp = serializer.validated_data['otp']
            
            verification_service = VerificationService()
            success, message = verification_service.verify_phone_otp(phone, otp)
            
            if success:
                user = User.objects.get(phone_number=phone)
                return Response(
                    {
                        "message": message,
                        "user": UserProfileSerializer(user).data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "error": {
                            "code": "VERIFICATION_FAILED",
                            "message": message
                        },
                        "timestamp": timezone.now().isoformat(),
                        "path": request.path
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid phone number or OTP"
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class ResendEmailVerificationView(APIView):
    """Resend email verification endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AuthenticationRateThrottle]
    
    def post(self, request):
        user = request.user
        
        if user.email_verified:
            return Response(
                {
                    "error": {
                        "code": "ALREADY_VERIFIED",
                        "message": "Email is already verified"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.email:
            return Response(
                {
                    "error": {
                        "code": "NO_EMAIL",
                        "message": "No email address associated with this account"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_service = VerificationService()
        if verification_service.send_email_verification(user):
            return Response(
                {"message": "Verification email sent"},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    "error": {
                        "code": "SEND_FAILED",
                        "message": "Failed to send verification email"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResendPhoneVerificationView(APIView):
    """Resend phone verification OTP endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [OTPVerificationRateThrottle]
    
    def post(self, request):
        user = request.user
        
        if user.phone_verified:
            return Response(
                {
                    "error": {
                        "code": "ALREADY_VERIFIED",
                        "message": "Phone number is already verified"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.phone_number:
            return Response(
                {
                    "error": {
                        "code": "NO_PHONE",
                        "message": "No phone number associated with this account"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_service = VerificationService()
        if verification_service.send_phone_verification(user):
            return Response(
                {"message": "OTP sent to your phone"},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {
                    "error": {
                        "code": "SEND_FAILED",
                        "message": "Failed to send OTP"
                    },
                    "timestamp": timezone.now().isoformat(),
                    "path": request.path
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(RetrieveUpdateAPIView):
    """User profile GET/PATCH endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UserProfileUpdateSerializer
        return UserProfileSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)  # Always allow partial updates
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(
                UserProfileSerializer(instance).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "fields": serializer.errors
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


class AccountDeactivationView(APIView):
    """Account deactivation endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AccountDeactivationSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            user.is_active = False
            user.save()
            
            logger.info(f"Account deactivated for user: {user.id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response(
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid password"
                },
                "timestamp": timezone.now().isoformat(),
                "path": request.path
            },
            status=status.HTTP_400_BAD_REQUEST
        )