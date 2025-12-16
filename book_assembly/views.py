from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import MonthlyBookModel
from .serializers import MonthlyBookSerializer
from .filters import MonthlyBookFilter


class MonthlyBookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows monthly books to be viewed and filtered.
    Public read-only access - no authentication required.
    """
    queryset = MonthlyBookModel.objects.all().order_by('-year', '-month')
    serializer_class = MonthlyBookSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = MonthlyBookFilter
