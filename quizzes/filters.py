from django_filters import rest_framework as filters
from .models import Quiz


class QuizFilter(filters.FilterSet):
    monthly_book = filters.UUIDFilter(field_name='monthly_book__id')

    class Meta:
        model = Quiz
        fields = ['monthly_book']
