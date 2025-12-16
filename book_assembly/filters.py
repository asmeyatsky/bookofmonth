import django_filters
from .models import MonthlyBookModel

class MonthlyBookFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    year = django_filters.NumberFilter(field_name='year')
    month = django_filters.NumberFilter(field_name='month')

    class Meta:
        model = MonthlyBookModel
        fields = ['title', 'year', 'month']
