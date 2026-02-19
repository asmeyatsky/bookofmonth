from django.db import models
import uuid

# Helper for list fields (e.g., categories, geographic_locations)
# In a real app, these would likely be separate models or a more robust solution
class ListField(models.JSONField):
    pass

class NewsEventModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    raw_content = models.TextField()
    source_url = models.URLField(max_length=1000)
    published_at = models.DateTimeField()
    # Storing as JSONField for simplicity in MVP. In a more complex scenario,
    # Fact, Category, GeographicLocation could be separate models.
    extracted_facts = ListField(default=list) # List of dictionaries representing Fact Value Object
    discussion_questions = ListField(default=list) # List of strings
    categories = ListField(default=list) # List of strings representing Category Enum values
    geographic_locations = ListField(default=list) # List of dictionaries representing GeographicLocation Value Object
    age_appropriateness = models.CharField(max_length=50, null=True, blank=True) # Storing AgeRange Enum value
    is_verified = models.BooleanField(default=False)
    processing_status = models.CharField(max_length=50, default="RAW")
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    video_url = models.URLField(max_length=1000, null=True, blank=True)
    fun_facts = ListField(default=list)
    content_elements = models.JSONField(default=None, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'news_events'
        ordering = ['-published_at']

    def __str__(self):
        return self.title
