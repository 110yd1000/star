from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import LimitOffsetPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid
import logging
import os

from .models import Ad, Category, SubCategory, Country, Province, City, AdMedia
from .serializers import (
    CategoryWithSubcategoriesSerializer, CountryWithProvincesSerializer,
    CountrySerializer, CountryListSerializer,
    AdCreateSerializer, AdSummarySerializer, AdDetailSerializer,
    AdUpdateSerializer, UserAdSummarySerializer, AdMediaSerializer,
    PaginationInfoSerializer
)
from .filters import AdFilter

logger = logging.getLogger(__name__)


class CustomPagination(LimitOffsetPagination):
    """Custom pagination class matching OpenAPI spec"""
    default_limit = 20
    limit_query_param = 'limit'
    offset_query_param = 'offset'
    max_limit = 100
    
    def get_paginated_response(self, data):
        return Response({
            'data': data,
            'pagination': {
                'total': self.count,
                'limit': self.limit,
                'offset': self.offset,
                'has_next': self.get_next_link() is not None,
                'has_previous': self.get_previous_link() is not None,
            }
        })


class CategoriesView(APIView):
    """Get all categories and their subcategories"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            categories = Category.objects.prefetch_related('subcategories').all()
            serializer = CategoryWithSubcategoriesSerializer(categories, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching categories: {str(e)}")
            return Response(
                {
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CountriesView(APIView):
    """Get all countries"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            countries = Country.objects.all()
            serializer = CountryListSerializer(countries, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching countries: {str(e)}")
            return Response(
                {
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LocationsView(APIView):
    """Get supported countries, provinces, and cities"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            countries = Country.objects.prefetch_related(
                'provinces__cities'
            ).all()
            serializer = CountrySerializer(countries, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching locations: {str(e)}")
            return Response(
                {
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred. Please try again later."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdViewSet(viewsets.ModelViewSet):
    """Main Ad ViewSet with CRUD operations"""
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AdFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'price', 'title']
    ordering = ['-created_at']
    pagination_class = CustomPagination
    
    def get_queryset(self):
        if self.action in ['list', 'retrieve']:
            # Public endpoints - only show active ads
            return Ad.objects.filter(status='active').select_related(
                'subcategory__category', 'country', 'province', 'city', 'author'
            ).prefetch_related('media')
        else:
            # Authenticated endpoints - show user's own ads
            if self.request.user.is_authenticated:
                return Ad.objects.filter(author=self.request.user).select_related(
                    'subcategory__category', 'country', 'province', 'city'
                ).prefetch_related('media')
            return Ad.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AdCreateSerializer
        elif self.action == 'retrieve':
            return AdDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return AdUpdateSerializer
        return AdSummarySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    ad = serializer.save()
                    logger.info(f"Ad created successfully: {ad.id} by user {request.user.id}")
                    return Response(
                        {
                            "id": ad.id,
                            "status": ad.status,
                            "message": "Ad created successfully and is pending approval"
                        },
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                logger.error(f"Error creating ad: {str(e)}")
                return Response(
                    {
                        "error": "creation_failed",
                        "message": "Failed to create ad. Please try again."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {
                "error": "validation_error",
                "message": "Invalid input data",
                "details": [
                    {"field": field, "message": errors[0] if isinstance(errors, list) else str(errors)}
                    for field, errors in serializer.errors.items()
                ]
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count
        Ad.objects.filter(id=instance.id).update(views=instance.views + 1)
        instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check ownership
        if instance.author != request.user:
            return Response(
                {
                    "error": "forbidden",
                    "message": "You don't have permission to access this resource"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            updated_fields = list(serializer.validated_data.keys())
            serializer.save()
            
            return Response(
                {
                    "id": instance.id,
                    "message": "Ad updated successfully",
                    "updated_fields": updated_fields
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                "error": "validation_error",
                "message": "Invalid input data",
                "details": [
                    {"field": field, "message": errors[0] if isinstance(errors, list) else str(errors)}
                    for field, errors in serializer.errors.items()
                ]
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check ownership
        if instance.author != request.user:
            return Response(
                {
                    "error": "forbidden",
                    "message": "You don't have permission to access this resource"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        logger.info(f"Ad deleted: {instance.id} by user {request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Pause an ad manually"""
        ad = self.get_object()
        
        if ad.author != request.user:
            return Response(
                {
                    "error": "forbidden",
                    "message": "You don't have permission to access this resource"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        ad.status = 'paused'
        ad.save()
        
        logger.info(f"Ad paused: {ad.id} by user {request.user.id}")
        return Response(
            {
                "id": ad.id,
                "status": "paused",
                "message": "Ad has been paused successfully"
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a paused ad"""
        ad = self.get_object()
        
        if ad.author != request.user:
            return Response(
                {
                    "error": "forbidden",
                    "message": "You don't have permission to access this resource"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        ad.status = 'active'
        ad.save()
        
        logger.info(f"Ad reactivated: {ad.id} by user {request.user.id}")
        return Response(
            {
                "id": ad.id,
                "status": "active",
                "message": "Ad has been reactivated successfully"
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_media(self, request, pk=None):
        """Upload ad images"""
        ad = self.get_object()
        
        if ad.author != request.user:
            return Response(
                {
                    "error": "forbidden",
                    "message": "You don't have permission to access this resource"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        files = request.FILES.getlist('files')
        if not files:
            return Response(
                {
                    "error": "validation_error",
                    "message": "No files provided"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(files) > settings.MAX_IMAGES_PER_AD:
            return Response(
                {
                    "error": "validation_error",
                    "message": f"Maximum {settings.MAX_IMAGES_PER_AD} images allowed"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_files = []
        
        try:
            with transaction.atomic():
                for file in files:
                    # Validate file size
                    if file.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
                        return Response(
                            {
                                "error": "file_too_large",
                                "message": "File size exceeds 5MB limit"
                            },
                            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        )
                    
                    # Validate file extension
                    file_ext = os.path.splitext(file.name)[1].lower()
                    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
                        return Response(
                            {
                                "error": "invalid_file_type",
                                "message": f"Only {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)} files are allowed"
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Generate unique filename
                    filename = f"ads/{ad.id}/{uuid.uuid4()}{file_ext}"
                    
                    # Save file
                    saved_path = default_storage.save(filename, ContentFile(file.read()))
                    file_url = default_storage.url(saved_path)
                    
                    # Create AdMedia record
                    media = AdMedia.objects.create(
                        ad=ad,
                        file_url=file_url,
                        media_type='image'
                    )
                    
                    uploaded_files.append({
                        "filename": file.name,
                        "url": file_url,
                        "size": file.size
                    })
                
                # Set first image as thumbnail if no thumbnail exists
                if not ad.thumbnail and uploaded_files:
                    ad.thumbnail = uploaded_files[0]["url"]
                    ad.save()
                
                logger.info(f"Media uploaded for ad {ad.id}: {len(uploaded_files)} files")
                return Response(
                    {
                        "uploaded_files": uploaded_files,
                        "total_uploaded": len(uploaded_files),
                        "message": f"{len(uploaded_files)} images uploaded successfully"
                    },
                    status=status.HTTP_200_OK
                )
                
        except Exception as e:
            logger.error(f"Error uploading media for ad {ad.id}: {str(e)}")
            return Response(
                {
                    "error": "upload_failed",
                    "message": "Failed to upload images. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserAdsView(APIView):
    """Get current user's ads"""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = CustomPagination
    
    def get(self, request):
        status_filter = request.query_params.get('status')
        
        queryset = Ad.objects.filter(author=request.user).select_related(
            'subcategory__category', 'country', 'province', 'city'
        ).prefetch_related('media')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = UserAdSummarySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = UserAdSummarySerializer(queryset, many=True)
        return Response(serializer.data)