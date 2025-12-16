from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend # New import
from .models import MonthlyBookModel
from .serializers import MonthlyBookSerializer
from .filters import MonthlyBookFilter # New import

class MonthlyBookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows monthly books to be viewed and filtered.
    """
    queryset = MonthlyBookModel.objects.all().order_by('-year', '-month')
    serializer_class = MonthlyBookSerializer
    filter_backends = [DjangoFilterBackend] # Add filter backend
    filterset_class = MonthlyBookFilter # Specify filterset class
