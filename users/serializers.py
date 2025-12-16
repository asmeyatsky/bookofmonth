from rest_framework import serializers
from .models import CustomUser, Bookmark, ReadingProgress, ChildProfile, ReadingStreak, Achievement, UserAchievement
from content_pipeline.serializers import NewsEventSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

class BookmarkSerializer(serializers.ModelSerializer):
    news_event = NewsEventSerializer(read_only=True)
    news_event_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Bookmark
        fields = ('id', 'user', 'news_event', 'news_event_id', 'created_at')
        read_only_fields = ('user',)

    def create(self, validated_data):
        news_event_id = validated_data.pop('news_event_id')
        user = self.context['request'].user
        bookmark = Bookmark.objects.create(user=user, news_event_id=news_event_id, **validated_data)
        return bookmark

class ReadingProgressSerializer(serializers.ModelSerializer):
    news_event = NewsEventSerializer(read_only=True)
    news_event_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = ReadingProgress
        fields = ('id', 'user', 'news_event', 'news_event_id', 'completed', 'last_read_at')
        read_only_fields = ('user', 'last_read_at')

    def create(self, validated_data):
        news_event_id = validated_data.pop('news_event_id', None)
        user = self.context['request'].user
        reading_progress, created = ReadingProgress.objects.get_or_create(
            user=user,
            news_event_id=news_event_id,
            defaults={'completed': validated_data.get('completed', False)}
        )
        if not created:
            reading_progress.completed = validated_data.get('completed', reading_progress.completed)
            reading_progress.save()
        return reading_progress

    def update(self, instance, validated_data):
        instance.completed = validated_data.get('completed', instance.completed)
        instance.save()
        return instance

class ChildProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildProfile
        fields = ('id', 'user', 'name', 'age', 'reading_level', 'created_at', 'updated_at')
        read_only_fields = ('user',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return ChildProfile.objects.create(**validated_data)

class ReadingStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingStreak
        fields = ('id', 'user', 'current_streak', 'longest_streak', 'last_read_date', 'updated_at')
        read_only_fields = ('user', 'current_streak', 'longest_streak', 'last_read_date', 'updated_at')

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ('id', 'user', 'achievement', 'achieved_at')
        read_only_fields = ('user', 'achievement', 'achieved_at')
