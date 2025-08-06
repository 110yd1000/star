# 🛠️ Technology Stack: Stardust Classifieds Platform

## Backend Technologies

### Core Framework

- **Django 4.2.23** - Main web framework
- **Django REST Framework 3.16.0** - API development
- **Python 3.x** - Programming language

### Database & Storage

- **PostgreSQL** - Primary database (configured via environment)
- **psycopg2-binary 2.9.10** - PostgreSQL adapter
- **Django file storage** - Media file handling

### Authentication & Security

- **djangorestframework-simplejwt 5.5.1** - JWT token authentication
- **PyJWT 2.10.1** - JWT token handling
- **django-cors-headers 4.7.0** - CORS support for frontend
- **django-environ 0.12.0** - Environment variable management

### Communication Services

- **Twilio** - SMS/phone verification (configured via settings)
- **Django email backend** - Email verification and notifications
- **SMTP configuration** - Email delivery

### API & Documentation

- **drf-yasg** - Swagger/OpenAPI documentation
- **django-filter** - Advanced filtering capabilities
- **Pagination** - Custom limit/offset pagination

### Development & Utilities

- **Pillow 11.3.0** - Image processing
- **django-allauth 65.10.0** - Additional authentication features
- **django-axes 8.0.0** - Brute force protection
- **django-ratelimit 4.1.0** - Rate limiting
- **Celery & Redis** - Background task processing (configured)

## Frontend Technologies

### Core Framework

- **React 19.1.0** - UI library
- **React DOM 19.1.0** - DOM rendering
- **Vite 7.0.4** - Build tool and dev server

### Routing & State Management

- **React Router DOM 7.7.0** - Client-side routing
- **React Context API** - Global state management (AuthContext)

### Styling & UI

- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **@tailwindcss/vite 4.1.11** - Vite integration
- **@tailwindcss/postcss 4.1.11** - PostCSS integration
- **Lucide React 0.525.0** - Icon library
- **clsx 2.1.1** - Conditional class names

### Forms & Validation

- **React Hook Form 7.61.0** - Form handling
- **@hookform/resolvers 5.1.1** - Form validation resolvers
- **Zod 4.0.8** - Schema validation

### HTTP Client

- **Axios 1.11.0** - HTTP requests
- **Custom ApiService** - Centralized API handling with token refresh

### Development Tools

- **ESLint 9.30.1** - Code linting
- **@eslint/js 9.30.1** - ESLint JavaScript rules
- **eslint-plugin-react-hooks 5.2.0** - React hooks linting
- **eslint-plugin-react-refresh 0.4.20** - React refresh linting
- **@vitejs/plugin-react 4.6.0** - React plugin for Vite
- **TypeScript support** - Type definitions for React

## Development Environment

### Package Management

- **npm/pnpm** - Frontend package management
- **pip** - Python package management
- **Virtual environments** - Python dependency isolation

### Build System

- **Vite** - Frontend build tool with HMR
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixes

### Development Servers

- **Django development server** - Backend (port 8000)
- **Vite dev server** - Frontend (port 5173)
- **CORS configuration** - Cross-origin requests between servers

## Database Configuration

### PostgreSQL Setup

```sql
CREATE DATABASE stardust_db;
CREATE USER stardust_user WITH PASSWORD 's63GK94t<';
GRANT ALL PRIVILEGES ON DATABASE stardust_db TO stardust_user;
```

### Django Database Settings

- **Engine**: `django.db.backends.postgresql`
- **Connection**: Environment-based configuration
- **Migrations**: Available for all models
- **Indexing**: Optimized for common queries

## File Structure & Organization

### Backend Structure

```
stardust-backend/
├── config/          # Project configuration
├── accounts/        # User management
├── ads/            # Classified ads
├── media/          # Uploaded files
├── logs/           # Application logs
└── requirements.txt # Python dependencies
```

### Frontend Structure

```
stardust-frontend/
├── src/
│   ├── components/  # Reusable components
│   ├── pages/      # Page components
│   ├── context/    # React contexts
│   ├── services/   # API services
│   └── assets/     # Static assets
├── public/         # Public assets
└── package.json    # Node dependencies
```

## Environment Configuration

### Backend Environment Variables

- `DEBUG` - Development mode toggle
- `SECRET_KEY` - Django secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Database config
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` - Email config
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS config
- `FRONTEND_URL` - Frontend URL for email links
- `ALLOWED_HOSTS` - Allowed host names

### Frontend Configuration

- **Base URL**: Configured for development (localhost:5173)
- **API Endpoints**: Full path endpoints to backend
- **CORS**: Configured for cross-origin requests

## Security Configuration

### JWT Settings

- **Access Token Lifetime**: 1 hour
- **Refresh Token Lifetime**: 7 days
- **Token Rotation**: Enabled
- **Blacklisting**: After rotation

### File Upload Security

- **Max File Size**: 5MB per file
- **Allowed Extensions**: JPG, JPEG, PNG, WEBP
- **Max Images per Ad**: 10
- **Storage Path**: `ads/{ad_id}/{uuid}.ext`

### Rate Limiting

- **Anonymous**: 100/hour
- **Authenticated**: 1000/hour
- **Authentication**: 5/minute
- **Password Reset**: 3/hour
- **OTP Verification**: 10/hour

## API Documentation

### Available Documentation

- **Swagger UI**: `/swagger/` - Interactive API documentation
- **ReDoc**: `/redoc/` - Alternative documentation interface
- **OpenAPI Spec**: Auto-generated from DRF serializers and views

### API Versioning

- **Current Version**: v1
- **Base Path**: `/api/v1/ads/`
- **Accounts Path**: `/accounts/api/accounts/`

## Deployment Considerations

### Production Requirements

- **PostgreSQL server** - Production database
- **Redis server** - Celery task queue
- **SMTP server** - Email delivery
- **Twilio account** - SMS services
- **Static file serving** - Nginx/Apache for static files
- **Media file storage** - Local or cloud storage

### Performance Optimizations

- **Database indexing** - Optimized for common queries
- **Query optimization** - select_related and prefetch_related
- **Caching** - Redis for session and cache storage
- **Static file compression** - Gzip compression
- **Image optimization** - Pillow for image processing

## Development Workflow

### Backend Development

1. **Virtual environment** - Python dependency isolation
2. **Django migrations** - Database schema management
3. **Django admin** - Administrative interface
4. **API testing** - DRF browsable API and Swagger

### Frontend Development

1. **Vite dev server** - Hot module replacement
2. **ESLint** - Code quality enforcement
3. **Component development** - React component architecture
4. **API integration** - Centralized service layer

### Integration Testing

- **CORS configuration** - Cross-origin request handling
- **Authentication flow** - JWT token management
- **File upload testing** - Media handling
- **Error handling** - Centralized error management
