from rest_framework import generics, permissions
from ads.models import Ad
from ads.serializers import AdSerializer

class ModerateAdListView(generics.ListAPIView):
    queryset = Ad.objects.filter(is_approved=False).order_by('-created_at')
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAdminUser]


class ApproveAdView(generics.UpdateAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        serializer.save(is_approved=True)
