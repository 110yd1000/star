from rest_framework import generics, filters
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from ads.models import Ad
from ads.serializers import AdSerializer
from ads.filters import AdFilter

class AdListCreateView(generics.ListCreateAPIView):
    queryset = Ad.objects.filter(is_active=True, is_approved=True).order_by('-created_at')
    serializer_class = AdSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AdFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'price']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
