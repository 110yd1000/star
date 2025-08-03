# accounts/urls.py
from django.urls import path, include
from django.contrib.auth.views import LogoutView
from . import views
from .api_views import (
    HealthCheckView, UserRegistrationView, UserLoginView, UserLogoutView,
    CustomTokenRefreshView, PasswordChangeView, PasswordResetView,
    PasswordResetConfirmView, EmailVerificationView, PhoneVerificationView,
    ResendEmailVerificationView, ResendPhoneVerificationView,
    UserProfileView, AccountDeactivationView
)

app_name = 'accounts'

# Web URLs (existing Django views)
web_patterns = [
    path('login/', views.custom_login_view, name='login'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('signup/', views.CustomSignUpView.as_view(), name='signup'),
    path('logout/', LogoutView.as_view(), name='logout'),
]

# API URLs (new REST API endpoints matching OpenAPI spec)
api_patterns = [
    # System
    path('health/', HealthCheckView.as_view(), name='health_check'),
    
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='api_register'),
    path('login/', UserLoginView.as_view(), name='api_login'),
    path('logout/', UserLogoutView.as_view(), name='api_logout'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    # Password Management
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/reset/resend/', PasswordResetView.as_view(), name='password_reset_resend'),  # Same as reset
    
    # Verification
    path('verify/email/', EmailVerificationView.as_view(), name='verify_email'),
    path('verify/email/resend/', ResendEmailVerificationView.as_view(), name='resend_email_verification'),
    path('verify/phone/', PhoneVerificationView.as_view(), name='verify_phone'),
    path('verify/phone/resend/', ResendPhoneVerificationView.as_view(), name='resend_phone_verification'),
    
    # User Management
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('deactivate/', AccountDeactivationView.as_view(), name='account_deactivation'),
    
    # Legacy API endpoints (for backward compatibility)
    path('api/register/', views.register_api, name='legacy_api_register'),
    path('api/login/', views.login_api, name='legacy_api_login'),
]

urlpatterns = [
    path('', include(web_patterns)),
    path('api/accounts/', include(api_patterns)),
]