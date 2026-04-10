from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from themes.models import Theme
from themes.serializers import ThemeSerializer


class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    lookup_field = "pk"

    def get_permissions(self):
        """Allow unauthenticated reads (for public theme loading), require auth for writes."""
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Theme.objects.all()
