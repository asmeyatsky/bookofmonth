from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend # New import
from .models import NewsEventModel
from .serializers import NewsEventSerializer
from .filters import NewsEventFilter # New import

class NewsEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows news events to be viewed and filtered.
    """
    queryset = NewsEventModel.objects.all().order_by('-published_at')
    serializer_class = NewsEventSerializer
    filter_backends = [DjangoFilterBackend] # Add filter backend
    filterset_class = NewsEventFilter # Specify filterset class
