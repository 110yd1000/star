# Stardust Backend API Endpoints Documentation

## Overview

The Stardust backend is a Django REST API with comprehensive endpoints for user management and classified ads. The API includes both modern REST endpoints and some legacy endpoints for backward compatibility.

## Base URL Structure

- **Main Config**: `/`
- **Accounts**: `/accounts/`
- **Ads API**: `/api/v1/ads/`
- **API Documentation**: `/swagger/` and `/redoc/`

---

## System Endpoints

### Health Check

- **GET** `/health/` - System health check
  - **Permission**: Public
  - **Response**: System status, database connectivity, email/SMS service status

---

## Authentication & User Management Endpoints

### Core Authentication

- **POST** `/accounts/api/accounts/register/` - User registration

  - **Permission**: Public
  - **Throttling**: AuthenticationRateThrottle
  - **Response**: User ID, verification requirements

- **POST** `/accounts/api/accounts/login/` - User login

  - **Permission**: Public
  - **Throttling**: AuthenticationRateThrottle
  - **Response**: JWT tokens (access/refresh), user profile

- **POST** `/accounts/api/accounts/logout/` - User logout

  - **Permission**: Authenticated
  - **Body**: `refresh_token`
  - **Action**: Blacklists refresh token

- **POST** `/accounts/api/accounts/token/refresh/` - Refresh JWT token
  - **Permission**: Public
  - **Body**: `refresh` token
  - **Response**: New access token with expiry

### Password Management

- **POST** `/accounts/api/accounts/password/change/` - Change password (authenticated)

  - **Permission**: Authenticated
  - **Body**: `current_password`, `new_password`

- **POST** `/accounts/api/accounts/password/reset/` - Request password reset

  - **Permission**: Public
  - **Throttling**: PasswordResetRateThrottle
  - **Body**: `phone_or_email`
  - **Action**: Sends reset instructions via email/SMS

- **POST** `/accounts/api/accounts/password/reset/confirm/` - Confirm password reset

  - **Permission**: Public
  - **Body**: `token`, `new_password`

- **POST** `/accounts/api/accounts/password/reset/resend/` - Resend password reset
  - **Permission**: Public
  - **Same as password reset endpoint**

### Email & Phone Verification

- **POST** `/accounts/api/accounts/verify/email/` - Verify email address

  - **Permission**: Public
  - **Body**: `key` (verification token)

- **POST** `/accounts/api/accounts/verify/email/resend/` - Resend email verification

  - **Permission**: Authenticated
  - **Throttling**: AuthenticationRateThrottle

- **POST** `/accounts/api/accounts/verify/phone/` - Verify phone number

  - **Permission**: Public
  - **Throttling**: OTPVerificationRateThrottle
  - **Body**: `phone`, `otp`

- **POST** `/accounts/api/accounts/verify/phone/resend/` - Resend phone OTP
  - **Permission**: Authenticated
  - **Throttling**: OTPVerificationRateThrottle

### User Profile Management

- **GET** `/accounts/api/accounts/me/` - Get user profile

  - **Permission**: Authenticated
  - **Response**: Complete user profile data

- **PATCH** `/accounts/api/accounts/me/` - Update user profile

  - **Permission**: Authenticated
  - **Body**: Partial user data (any profile fields)
  - **Response**: Updated user profile

- **POST** `/accounts/api/accounts/deactivate/` - Deactivate account
  - **Permission**: Authenticated
  - **Body**: `password` (confirmation)
  - **Action**: Sets `is_active = False`

### Legacy Authentication Endpoints

- **POST** `/accounts/api/register/` - Legacy registration endpoint
- **POST** `/accounts/api/login/` - Legacy login endpoint

### Web Authentication (Non-API)

- **GET/POST** `/accounts/login/` - Web login form
- **GET/POST** `/accounts/register/` - Web registration form
- **GET/POST** `/accounts/signup/` - Web signup form (alias)
- **POST** `/accounts/logout/` - Web logout

---

## Ads & Classified Endpoints

### Taxonomy & Geography

- **GET** `/api/v1/ads/categories/` - Get all categories and subcategories

  - **Permission**: Public
  - **Response**: Hierarchical category structure

- **GET** `/api/v1/ads/locations/` - Get supported locations
  - **Permission**: Public
  - **Response**: Countries, provinces, and cities hierarchy

### Ad CRUD Operations

- **GET** `/api/v1/ads/ads/` - List active ads (public)

  - **Permission**: Public
  - **Filters**: Category, location, price range, search terms
  - **Pagination**: Limit/offset with metadata
  - **Ordering**: created_at, price, title

- **POST** `/api/v1/ads/ads/` - Create new ad

  - **Permission**: Authenticated
  - **Response**: Ad ID, status, approval message

- **GET** `/api/v1/ads/ads/{id}/` - Get ad details

  - **Permission**: Public
  - **Action**: Increments view count
  - **Response**: Complete ad details with media

- **PATCH** `/api/v1/ads/ads/{id}/` - Update ad (partial)

  - **Permission**: Authenticated (owner only)
  - **Response**: Updated fields confirmation

- **DELETE** `/api/v1/ads/ads/{id}/` - Delete ad
  - **Permission**: Authenticated (owner only)
  - **Response**: 204 No Content

### Ad Actions

- **POST** `/api/v1/ads/ads/{id}/deactivate/` - Pause ad

  - **Permission**: Authenticated (owner only)
  - **Action**: Sets status to 'paused'

- **POST** `/api/v1/ads/ads/{id}/reactivate/` - Reactivate paused ad

  - **Permission**: Authenticated (owner only)
  - **Action**: Sets status to 'active'

- **POST** `/api/v1/ads/ads/{id}/upload-media/` - Upload ad images
  - **Permission**: Authenticated (owner only)
  - **Content-Type**: multipart/form-data
  - **Body**: `files[]` (multiple image files)
  - **Limits**: Max 5MB per file, specific extensions only
  - **Action**: Sets first image as thumbnail if none exists

### User Ad Management

- **GET** `/api/v1/ads/user/ads/` - Get current user's ads
  - **Permission**: Authenticated
  - **Query Params**: `status` (filter by ad status)
  - **Pagination**: Limit/offset with metadata
  - **Response**: User's ads with management data

### Legacy Ad Endpoints

- **GET** `/api/v1/ads/legacy/categories/` - Legacy categories endpoint
- **Various** `/api/v1/ads/legacy/ads/` - Legacy ad CRUD endpoints

---

## API Documentation

- **GET** `/swagger/` - Swagger UI documentation
- **GET** `/redoc/` - ReDoc documentation interface

---

## Authentication Methods

### JWT Token Authentication

- **Access Token**: Short-lived token for API requests
- **Refresh Token**: Long-lived token for obtaining new access tokens
- **Header Format**: `Authorization: Bearer <access_token>`

### Rate Limiting

- **AuthenticationRateThrottle**: Applied to login/register endpoints
- **PasswordResetRateThrottle**: Applied to password reset requests
- **OTPVerificationRateThrottle**: Applied to phone verification

---

## Response Formats

### Success Responses

```json
{
  "data": "...",
  "message": "Success message"
}
```

### Error Responses

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "fields": {} // For validation errors
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint",
  "request_id": "uuid"
}
```

### Paginated Responses

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_next": true,
    "has_previous": false
  }
}
```

---

## File Upload Specifications

### Ad Media Upload

- **Supported Formats**: JPG, JPEG, PNG, GIF, WEBP
- **Max File Size**: 5MB per file
- **Max Files**: Configurable (typically 5-10 images per ad)
- **Storage**: Organized by ad ID (`ads/{ad_id}/{uuid}.ext`)

---

## Status Codes

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **204**: No Content (successful deletion)
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **413**: Request Entity Too Large (file size)
- **422**: Unprocessable Entity (validation errors)
- **429**: Too Many Requests (rate limiting)
- **500**: Internal Server Error
- **503**: Service Unavailable (health check failure)

---

## Security Features

### Built-in Security

- JWT token authentication with blacklisting
- Rate limiting on sensitive endpoints
- CORS configuration
- Input validation and sanitization
- File upload restrictions
- Password strength requirements
- Account lockout protection (django-axes)

### Verification Systems

- Email verification with secure tokens
- Phone verification with OTP
- Password reset with time-limited tokens
- Account deactivation with password confirmation

---

## Integration Notes

### Frontend Integration

- CORS configured for `http://localhost:5173` (Vite dev server)
- JWT tokens should be stored securely (httpOnly cookies recommended)
- Refresh token rotation supported
- File uploads require multipart/form-data

### Database

- PostgreSQL recommended (configured in .env)
- Migrations available for all models
- Optimized queries with select_related and prefetch_related

This documentation covers all available API endpoints in the Stardust backend as of the current implementation.
