# 🏗️ System Architecture: Stardust Classifieds Platform

## Overall Architecture

**Stardust** follows a modern **API-first architecture** with clear separation between backend and frontend:

- **Backend**: Django + Django REST Framework (DRF) API server
- **Frontend**: React SPA with Vite build system
- **Database**: PostgreSQL with optimized indexing
- **Authentication**: JWT tokens with refresh token rotation
- **Media**: Django file handling with configurable storage

## Backend Architecture (`stardust-backend/`)

### Core Applications

1. **[`accounts/`](stardust-backend/accounts/)** - User management and authentication

   - [`models.py`](stardust-backend/accounts/models.py:47) - CustomUser with email/phone flexibility
   - [`api_views.py`](stardust-backend/accounts/api_views.py:76) - REST API endpoints for auth
   - [`verification_models.py`](stardust-backend/accounts/verification_models.py:10) - Email/SMS verification tokens
   - [`services.py`](stardust-backend/accounts/services.py:146) - Email/SMS service layer
   - [`backends.py`](stardust-backend/accounts/backends.py) - Custom authentication backend

2. **[`ads/`](stardust-backend/ads/)** - Classified ads management

   - [`models.py`](stardust-backend/ads/models.py:44) - Ad, Category, Location models
   - [`api_views.py`](stardust-backend/ads/api_views.py:110) - CRUD operations with ViewSets
   - [`filters.py`](stardust-backend/ads/filters.py) - Advanced filtering capabilities

3. **[`config/`](stardust-backend/config/)** - Project configuration
   - [`settings.py`](stardust-backend/config/settings.py:130) - Comprehensive Django settings
   - [`urls.py`](stardust-backend/config/urls.py:39) - URL routing configuration

### Key Design Patterns

#### Authentication System

- **Custom User Model**: [`CustomUser`](stardust-backend/accounts/models.py:47) supports email OR phone login
- **JWT Implementation**: [`rest_framework_simplejwt`](stardust-backend/config/settings.py:159) with token blacklisting
- **Verification System**: Separate models for email tokens and phone OTPs
- **Custom Backend**: [`EmailPhoneAuthBackend`](stardust-backend/accounts/backends.py) handles dual login methods

#### API Design

- **ViewSet Pattern**: [`AdViewSet`](stardust-backend/ads/api_views.py:110) for CRUD operations
- **Custom Pagination**: [`CustomPagination`](stardust-backend/ads/api_views.py:31) with metadata
- **Filtering**: [`DjangoFilterBackend`](stardust-backend/ads/api_views.py:112) with search and ordering
- **Permission Classes**: Granular permissions per endpoint

#### Data Models

- **User Roles**: [`ROLES`](stardust-backend/accounts/models.py:48) - user, admin, moderator
- **Ad Status Flow**: [`STATUS_CHOICES`](stardust-backend/ads/models.py:45) - pending → active/rejected
- **Location Hierarchy**: [`Province`](stardust-backend/ads/models.py:27) → [`City`](stardust-backend/ads/models.py:34)
- **Category Structure**: [`Category`](stardust-backend/ads/models.py:5) → [`SubCategory`](stardust-backend/ads/models.py:15)

## Frontend Architecture (`stardust-frontend/`)

### Component Structure

1. **[`src/context/`](stardust-frontend/src/context/)** - Global state management

   - [`AuthContext.jsx`](stardust-frontend/src/context/AuthContext.jsx:14) - Authentication state and methods

2. **[`src/services/`](stardust-frontend/src/services/)** - API integration layer

   - [`api.js`](stardust-frontend/src/services/api.js:2) - Centralized API service with token refresh

3. **[`src/components/`](stardust-frontend/src/components/)** - Reusable components

   - [`ProtectedRoute.jsx`](stardust-frontend/src/components/ProtectedRoute.jsx) - Route protection
   - [`Navigation.jsx`](stardust-frontend/src/components/Navigation.jsx) - App navigation

4. **[`src/pages/`](stardust-frontend/src/pages/)** - Page components
   - [`Home.jsx`](stardust-frontend/src/pages/Home.jsx:6) - Category browsing interface
   - [`Login.jsx`](stardust-frontend/src/pages/Login.jsx:6) - Dual login/register form
   - [`PostAd.jsx`](stardust-frontend/src/pages/PostAd.jsx) - Ad creation interface

### Key Frontend Patterns

#### Authentication Flow

- **Token Storage**: localStorage for access/refresh tokens
- **Auto-refresh**: [`refreshToken()`](stardust-frontend/src/context/AuthContext.jsx:136) on 401 responses
- **Route Protection**: [`ProtectedRoute`](stardust-frontend/src/components/ProtectedRoute.jsx) wrapper
- **Dual Login**: Email or phone number authentication

#### API Integration

- **Service Layer**: [`ApiService`](stardust-frontend/src/services/api.js:2) class with request interceptors
- **Error Handling**: Centralized error handling with token refresh
- **Endpoint Mapping**: Full path endpoints matching Django URL structure

## URL Structure & API Endpoints

### Backend URL Patterns

```
/admin/                          # Django admin
/health/                         # System health check
/accounts/                       # Web authentication forms
/accounts/api/accounts/          # REST API for user management
/api/v1/ads/                     # REST API for ads and categories
/swagger/                        # API documentation
```

### Key API Endpoints

- **Auth**: [`/accounts/api/accounts/login/`](stardust-backend/accounts/urls.py:29)
- **User Profile**: [`/accounts/api/accounts/me/`](stardust-backend/accounts/urls.py:47)
- **Ads CRUD**: [`/api/v1/ads/ads/`](stardust-backend/ads/urls.py:20)
- **Categories**: [`/api/v1/ads/categories/`](stardust-backend/ads/urls.py:14)
- **Locations**: [`/api/v1/ads/locations/`](stardust-backend/ads/urls.py:17)

## Database Schema

### Core Tables

- **CustomUser**: User accounts with email/phone flexibility
- **EmailVerificationToken**: Email verification tokens
- **PhoneVerificationOTP**: SMS verification codes
- **PasswordResetToken**: Password reset tokens
- **Ad**: Classified advertisements
- **Category/SubCategory**: Taxonomy hierarchy
- **Province/City**: Location hierarchy
- **AdMedia**: Image/video attachments

### Indexing Strategy

- **User lookups**: [`email`](stardust-backend/accounts/models.py:97), [`phone_number`](stardust-backend/accounts/models.py:98)
- **Ad queries**: [`status + created_at`](stardust-backend/ads/models.py:128), [`subcategory`](stardust-backend/ads/models.py:129), [`city`](stardust-backend/ads/models.py:130)
- **Token lookups**: [`token`](stardust-backend/accounts/verification_models.py:25), [`expires_at`](stardust-backend/accounts/verification_models.py:27)

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Access (1h) + Refresh (7d) with rotation
- **Token Blacklisting**: [`BlacklistedToken`](stardust-backend/accounts/verification_models.py:160) model
- **Rate Limiting**: [`AuthenticationRateThrottle`](stardust-backend/accounts/api_views.py:79) on sensitive endpoints
- **Permission Classes**: [`IsAuthenticated`](stardust-backend/ads/api_views.py:146) for protected resources

### Data Validation

- **Phone Format**: [`E.164 validation`](stardust-backend/accounts/models.py:60) (+1234567890)
- **File Uploads**: [`ALLOWED_IMAGE_EXTENSIONS`](stardust-backend/config/settings.py:250), size limits
- **Input Sanitization**: Django's built-in validation + custom validators

### Verification Systems

- **Email**: Secure token-based verification with expiry
- **Phone**: 6-digit OTP with attempt limits and expiry
- **Password Reset**: Time-limited tokens via email/SMS

## Development & Deployment

### Technology Stack

- **Backend**: [`Django 4.2.23`](stardust-backend/requirements.txt:3), [`DRF 3.16.0`](stardust-backend/requirements.txt:11)
- **Frontend**: [`React 19.1.0`](stardust-frontend/package.json:18), [`Vite 7.0.4`](stardust-frontend/package.json:37)
- **Database**: [`PostgreSQL`](stardust-backend/config/settings.py:42) with psycopg2
- **Styling**: [`Tailwind CSS 4.1.11`](stardust-frontend/package.json:36)

### Configuration Management

- **Environment Variables**: [`django-environ`](stardust-backend/config/settings.py:20) for settings
- **CORS**: [`django-cors-headers`](stardust-backend/config/settings.py:52) for frontend integration
- **Media Handling**: [`MEDIA_ROOT`](stardust-backend/config/settings.py:243) with URL serving

### Monitoring & Logging

- **Health Checks**: [`HealthCheckView`](stardust-backend/accounts/api_views.py:30) with service status
- **Structured Logging**: [`LOGGING`](stardust-backend/config/settings.py:275) configuration
- **Error Handling**: [`custom_exception_handler`](stardust-backend/config/settings.py:156)

## Critical Implementation Paths

### User Registration Flow

1. [`UserRegistrationView.post()`](stardust-backend/accounts/api_views.py:81) → Create user
2. [`VerificationService.send_email_verification()`](stardust-backend/accounts/services.py:153) → Send token
3. [`EmailVerificationView.post()`](stardust-backend/accounts/api_views.py:416) → Verify token
4. [`CustomUser.update_verification_status()`](stardust-backend/accounts/models.py:124) → Mark verified

### Ad Creation Flow

1. [`AdViewSet.create()`](stardust-backend/ads/api_views.py:149) → Create ad (pending)
2. [`AdViewSet.upload_media()`](stardust-backend/ads/api_views.py:307) → Upload images
3. Admin moderation → Status change to 'active'
4. [`AdViewSet.retrieve()`](stardust-backend/ads/api_views.py:186) → Public viewing with view count

### Authentication Flow

1. [`UserLoginView.post()`](stardust-backend/accounts/api_views.py:146) → Validate credentials
2. [`RefreshToken.for_user()`](stardust-backend/accounts/api_views.py:153) → Generate JWT tokens
3. [`AuthContext.login()`](stardust-frontend/src/context/AuthContext.jsx:56) → Store tokens
4. [`ApiService.request()`](stardust-frontend/src/services/api.js:24) → Auto token refresh
