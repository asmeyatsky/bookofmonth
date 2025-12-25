from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, Bookmark, ReadingProgress, ChildProfile, ReadingStreak, Achievement, UserAchievement
from content_pipeline.serializers import NewsEventSerializer


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_active')
        read_only_fields = ('id', 'date_joined', 'is_active')
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }


class BookmarkSerializer(serializers.ModelSerializer):
    news_event = NewsEventSerializer(read_only=True)
    news_event_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Bookmark
        fields = ('id', 'user', 'news_event', 'news_event_id', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

    def create(self, validated_data):
        news_event_id = validated_data.pop('news_event_id')
        bookmark = Bookmark.objects.create(news_event_id=news_event_id, **validated_data)
        return bookmark


class ReadingProgressSerializer(serializers.ModelSerializer):
    news_event = NewsEventSerializer(read_only=True)
    news_event_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = ReadingProgress
        fields = ('id', 'user', 'news_event', 'news_event_id', 'completed', 'last_read_at')
        read_only_fields = ('id', 'user', 'last_read_at')

    def create(self, validated_data):
        news_event_id = validated_data.pop('news_event_id', None)
        user = validated_data.get('user')
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
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_age(self, value):
        if value < 1 or value > 18:
            raise serializers.ValidationError('Age must be between 1 and 18.')
        return value


class ReadingStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingStreak
        fields = ('id', 'user', 'current_streak', 'longest_streak', 'last_read_date', 'updated_at')
        read_only_fields = ('id', 'user', 'current_streak', 'longest_streak', 'last_read_date', 'updated_at')


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ('id', 'name', 'description', 'image_url')
        read_only_fields = ('id', 'name', 'description', 'image_url')


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ('id', 'user', 'achievement', 'achieved_at')
        read_only_fields = ('id', 'user', 'achievement', 'achieved_at')


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('No user found with this email address.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs
