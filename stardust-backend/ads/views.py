from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters
from .models import Ad, Category, Province
from .serializers import (
    CategorySerializer, AdCreateSerializer, 
    AdSummarySerializer, AdDetailSerializer
)
from .filters import AdFilter

# Create your views here.

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class AdViewSet(viewsets.ModelViewSet):
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = AdFilter
    
    def get_queryset(self):
        if self.action in ['list', 'retrieve']:
            return Ad.objects.filter(status='active')
        return Ad.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AdCreateSerializer
        elif self.action == 'retrieve':
            return AdDetailSerializer
        return AdSummarySerializer
    
    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            status='pending_approval'
        )
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        ad = self.get_object()
        if ad.author != request.user:
            return Response(
                {"error": "forbidden", "message": "Not authorized"},
                status=status.HTTP_403_FORBIDDEN
            )
        ad.status = 'paused'
        ad.save()
        return Response({
            "id": ad.id,
            "status": "paused",
            "message": "Ad has been paused successfully"
        })

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        ad = self.get_object()
        if ad.author != request.user:
            return Response(
                {"error": "forbidden", "message": "Not authorized"},
                status=status.HTTP_403_FORBIDDEN
            )
        ad.status = 'active'
        ad.save()
        return Response({
            "id": ad.id,
            "status": "active", 
            "message": "Ad has been reactivated successfully"
        })
