from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import NewsEventModel
from .serializers import NewsEventSerializer
from .filters import NewsEventFilter


class NewsEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows news events to be viewed and filtered.
    Public read-only access - no authentication required.
    """
    queryset = NewsEventModel.objects.all().order_by('-published_at')
    serializer_class = NewsEventSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = NewsEventFilter
