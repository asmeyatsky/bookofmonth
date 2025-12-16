from rest_framework import serializers
from .models import MonthlyBookModel


class MonthlyBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBookModel
        fields = (
            'id',
            'month',
            'year',
            'title',
            'cover_image_url',
            'daily_entries',
            'end_of_month_quiz',
            'parents_guide',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )
