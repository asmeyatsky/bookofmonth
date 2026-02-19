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
            'discussion_questions',
            'categories',
            'geographic_locations',
            'age_appropriateness',
            'is_verified',
            'processing_status',
            'image_url',
            'video_url',
            'fun_facts',
            'content_elements',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )

class ContentPipelineDailyEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsEventModel
        fields = ('id', 'title', 'image_url', 'video_url', 'fun_facts', 'discussion_questions', 'content_elements')
