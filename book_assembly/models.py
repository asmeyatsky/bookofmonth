from django.db import models
import uuid

class MonthlyBookModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    month = models.IntegerField()
    year = models.IntegerField()
    title = models.CharField(max_length=500)
    cover_image_url = models.URLField(max_length=1000)
    # Storing daily entries as a JSONField of NewsEvent IDs
    daily_entries = models.JSONField(default=list)
    end_of_month_quiz = models.JSONField(default=list)
    parents_guide = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'monthly_books'
        unique_together = ('year', 'month')
        ordering = ['-year', '-month']

    def __str__(self):
        return self.title
