from rest_framework import serializers
from .models import MonthlyBookModel
from content_pipeline.models import NewsEventModel
from content_pipeline.serializers import ContentPipelineDailyEntrySerializer


class MonthlyBookSerializer(serializers.ModelSerializer):
    daily_entries = serializers.SerializerMethodField()

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

    def get_daily_entries(self, obj):
        daily_entries_ids = obj.daily_entries
        # Fetch all NewsEventModel objects in a single query
        news_events = NewsEventModel.objects.filter(id__in=daily_entries_ids)
        # Create a dictionary for quick lookups
        news_events_dict = {str(event.id): event for event in news_events}
        # Preserve the order of IDs from the original list
        ordered_news_events = [news_events_dict[str(id)] for id in daily_entries_ids if str(id) in news_events_dict]
        return ContentPipelineDailyEntrySerializer(ordered_news_events, many=True).data
