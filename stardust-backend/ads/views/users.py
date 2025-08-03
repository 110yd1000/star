from rest_framework import generics, permissions
from ads.models import Ad
from ads.serializers import AdSerializer

class MyAdsView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ad.objects.filter(author=self.request.user).order_by('-created_at')


class AdUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Ad.objects.filter(author=user)
