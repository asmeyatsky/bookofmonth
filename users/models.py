from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from content_pipeline.models import NewsEventModel
from content_pipeline.domain.value_objects import AgeRange
from book_assembly.models import MonthlyBookModel

class CustomUser(AbstractUser):
    # Add additional fields here if needed
    pass

class Bookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    news_event = models.ForeignKey(NewsEventModel, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'news_event')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} bookmarked {self.news_event.title}"

class ReadingProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    news_event = models.ForeignKey(NewsEventModel, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'news_event')
        ordering = ['-last_read_at']

    def __str__(self):
        return f"{self.user.username} progress on {self.news_event.title}"

class ChildProfile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='child_profiles')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    reading_level = models.CharField(
        max_length=50,
        choices=[(tag.name, tag.value) for tag in AgeRange],
        default=AgeRange.AGE_7_9.name
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name}'s profile ({self.user.username})"

class ReadingStreak(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reading_streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_read_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s reading streak: {self.current_streak} days"

class Achievement(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    image_url = models.URLField(max_length=1000, blank=True, null=True)
    
    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    achieved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')
        ordering = ['-achieved_at']

    def __str__(self):
        return f"{self.user.username} earned {self.achievement.name}"
