from rest_framework import serializers
from .models import NewsEventModel


class NewsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsEventModel
        fields = (
            'id',
            'title',
            'raw_content',
            'source_url',
            'published_at',
            'extracted_facts',
            'categories',
            'geographic_locations',
            'age_appropriateness',
            'is_verified',
            'processing_status',
            'image_url',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )
