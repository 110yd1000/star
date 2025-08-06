# 📍 Current Context: Stardust Classifieds Platform

## Project Status

**Stardust** is a Django + React classifieds platform currently in **active development** with core functionality implemented and working.

## Current Implementation State

### ✅ Completed Features

#### Backend (Django + DRF)

- **User Management System**: Complete with dual email/phone authentication
- **JWT Authentication**: Access/refresh tokens with blacklisting and rotation
- **Verification Systems**: Email tokens and SMS OTP verification working
- **Ad Management**: Full CRUD operations with status workflow (pending → active/rejected)
- **Media Upload**: Image upload system with file validation and storage
- **API Documentation**: Swagger/OpenAPI documentation available
- **Database Models**: All core models implemented with proper indexing
- **Security**: Rate limiting, CORS, input validation, and permission classes

#### Frontend (React + Vite)

- **Authentication Flow**: Login/register with dual identifier support
- **Route Protection**: Protected routes with authentication checks
- **API Integration**: Centralized service layer with token refresh
- **Category Browsing**: Home page with category/subcategory display
- **Responsive Design**: Tailwind CSS with mobile-friendly interface

### 🚧 Current Development Focus

#### Recently Completed

- Fixed API endpoint URLs in frontend to match Django URL patterns
- Implemented comprehensive authentication system with verification
- Set up proper CORS configuration for frontend-backend communication
- Created modular API service layer with automatic token refresh

#### Active Work Areas

- **Ad Creation Interface**: PostAd component exists but needs completion
- **Ad Browsing**: Category-based ad listing and search functionality
- **User Dashboard**: Profile management and user's ads management
- **Admin Interface**: Moderation workflow for ad approval/rejection

### 🔄 Current Architecture

#### API Structure

```
Backend (Django):
- /accounts/api/accounts/ → User management endpoints
- /api/v1/ads/ → Ads and categories endpoints
- /health/ → System health check
- /swagger/ → API documentation

Frontend (React):
- AuthContext → Global authentication state
- ApiService → Centralized API communication
- Protected routes → Authentication-gated pages
```

#### Database Schema

- **Users**: CustomUser with email/phone flexibility
- **Verification**: Separate models for email tokens and phone OTPs
- **Ads**: Complete ad model with media, categories, and locations
- **Geography**: Province/City hierarchy for location filtering

### 🎯 Next Development Priorities

1. **Complete Ad Creation Flow**

   - Finish PostAd form with category/location selection
   - Implement image upload interface
   - Add form validation and error handling

2. **Ad Browsing & Search**

   - Category-based ad listing pages
   - Search functionality with filters
   - Pagination implementation

3. **User Dashboard**

   - User profile management
   - My ads listing with status management
   - Ad editing capabilities

4. **Admin Moderation**
   - Admin interface for ad approval
   - Bulk operations for moderation
   - User management tools

### 🔧 Technical Debt & Improvements

#### Known Issues

- Some legacy endpoints exist alongside new API structure
- Frontend error handling could be more comprehensive
- Media upload UI needs implementation
- Email templates need styling improvements

#### Performance Considerations

- Database queries are optimized with select_related/prefetch_related
- Proper indexing implemented for common query patterns
- JWT token refresh handled automatically
- File upload size limits and validation in place

### 🌐 Deployment Readiness

#### Development Environment

- **Backend**: Django dev server on port 8000
- **Frontend**: Vite dev server on port 5173
- **Database**: PostgreSQL with proper user/database setup
- **CORS**: Configured for local development

#### Production Considerations

- Environment variables properly configured
- Security settings implemented
- Logging system in place
- Health check endpoint available
- Static file handling configured

### 📋 Current File Structure

#### Key Backend Files

- `config/settings.py` - Comprehensive Django configuration
- `accounts/models.py` - Custom user model with verification
- `accounts/api_views.py` - Complete authentication API
- `ads/models.py` - Ad and taxonomy models
- `ads/api_views.py` - Ad CRUD operations

#### Key Frontend Files

- `src/context/AuthContext.jsx` - Authentication state management
- `src/services/api.js` - API service layer
- `src/pages/Home.jsx` - Category browsing interface
- `src/pages/Login.jsx` - Dual login/register form

### 🔍 Development Workflow

#### Current Setup

- Git version control in place
- Requirements files for both backend and frontend
- Environment-based configuration
- Modular application structure

#### Testing Status

- API endpoints functional and tested
- Frontend authentication flow working
- Database migrations applied
- CORS and API integration verified

This context reflects the current state as of the memory bank initialization, with a solid foundation built and core functionality working, ready for continued development of user-facing features.
