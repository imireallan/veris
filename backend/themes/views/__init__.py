from rest_framework import viewsets
from themes.models import Theme
from themes.serializers import ThemeSerializer

class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    lookup_field = "pk"
    
    def get_queryset(self):
        return Theme.objects.all()