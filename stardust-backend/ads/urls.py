from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, AdViewSet
from .api_views import CategoriesView, CountriesView, LocationsView, AdViewSet as NewAdViewSet, UserAdsView

# Legacy router for existing views
router = DefaultRouter()
router.register(r'legacy/categories', CategoryViewSet)
router.register(r'legacy/ads', AdViewSet, basename='legacy_ad')

# New API endpoints matching OpenAPI spec
api_patterns = [
    # Taxonomy
    path('categories/', CategoriesView.as_view(), name='categories'),
    
    # Geography
    path('countries/', CountriesView.as_view(), name='countries'),
    path('locations/', LocationsView.as_view(), name='locations'),
    
    # Ads CRUD
    path('ads/', NewAdViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='ads_list_create'),
    
    path('ads/<int:pk>/', NewAdViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='ads_detail'),
    
    # Ad actions
    path('ads/<int:pk>/deactivate/', NewAdViewSet.as_view({
        'post': 'deactivate'
    }), name='ads_deactivate'),
    
    path('ads/<int:pk>/reactivate/', NewAdViewSet.as_view({
        'post': 'reactivate'
    }), name='ads_reactivate'),
    
    path('ads/<int:pk>/upload-media/', NewAdViewSet.as_view({
        'post': 'upload_media'
    }), name='ads_upload_media'),
    
    # User ads
    path('user/ads/', UserAdsView.as_view(), name='user_ads'),
]

urlpatterns = [
    path('', include(api_patterns)),
    path('', include(router.urls)),  # Legacy endpoints
]
