import django_filters
from .models import NewsEventModel

class NewsEventFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    raw_content = django_filters.CharFilter(field_name='raw_content', lookup_expr='icontains')
    category = django_filters.CharFilter(field_name='categories', lookup_expr='icontains') # Assumes categories are stored as a string or searchable JSON
    published_after = django_filters.DateFilter(field_name='published_at', lookup_expr='date__gte')
    published_before = django_filters.DateFilter(field_name='published_at', lookup_expr='date__lte')

    class Meta:
        model = NewsEventModel
        fields = ['title', 'raw_content', 'category', 'published_after', 'published_before']
