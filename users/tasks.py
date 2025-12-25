# Celery Tasks for Background Processing

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from .services import AchievementService
from content_pipeline.models import NewsEventModel

User = get_user_model()

@shared_task(bind=True, max_retries=3)
def send_welcome_email(self, user_id):
    """Send welcome email to new user."""
    try:
        user = User.objects.get(id=user_id)
        subject = "Welcome to Book of the Month!"
        message = f"""
        Hi {user.username},
        
        Welcome to Book of the Month! We're excited to have you join our reading community.
        
        You can:
        - Read age-appropriate news content
        - Track your reading progress
        - Earn achievements and build reading streaks
        - Take quizzes to test your knowledge
        
        Start your reading journey today!
        
        Best regards,
        The Book of the Month Team
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return f"Welcome email sent to {user.email}"
        
    except Exception as exc:
        self.retry(exc=exc, countdown=60)

@shared_task(bind=True, max_retries=3)
def process_daily_content(self):
    """Process and ingest daily news content."""
    try:
        from content_pipeline.application.use_cases.ingest_news_events_use_case import IngestNewsEventsUseCase
        from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
        
        repository = DjangoNewsEventRepository()
        use_case = IngestNewsEventsUseCase(repository)
        
        # Process recent news (last 24 hours)
        result = use_case.execute(days_back=1)
        
        return f"Processed {result.get('events_processed', 0)} news events"
        
    except Exception as exc:
        self.retry(exc=exc, countdown=300)

@shared_task(bind=True, max_retries=3)
def generate_monthly_book(self, year, month):
    """Generate monthly book and associated content."""
    try:
        from book_assembly.application.use_cases.assemble_book_use_case import AssembleBookUseCase
        from book_assembly.infrastructure.repositories.monthly_book_repository import DjangoMonthlyBookRepository
        from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
        
        # Initialize repositories and services
        news_event_repository = DjangoNewsEventRepository()
        monthly_book_repository = DjangoMonthlyBookRepository()
        
        # This would need the service to be properly initialized
        # For now, just return a status
        return f"Book generation initiated for {month}/{year}"
        
    except Exception as exc:
        self.retry(exc=exc, countdown=600)

@shared_task
def cleanup_old_sessions():
    """Clean up expired sessions and temporary data."""
    try:
        from django.contrib.sessions.models import Session
        from datetime import datetime, timedelta
        
        # Delete sessions older than 30 days
        cutoff_date = datetime.now() - timedelta(days=30)
        deleted_count = Session.objects.filter(expire_date__lt=cutoff_date).delete()[0]
        
        return f"Cleaned up {deleted_count} old sessions"
        
    except Exception as e:
        return f"Session cleanup failed: {str(e)}"

@shared_task(bind=True, max_retries=2)
def update_user_achievements_batch(self, user_ids):
    """Update achievements for a batch of users."""
    try:
        updated_count = 0
        
        for user_id in user_ids:
            user = User.objects.get(id=user_id)
            AchievementService.update_reading_streak(user)
            updated_count += 1
        
        return f"Updated achievements for {updated_count} users"
        
    except Exception as exc:
        self.retry(exc=exc, countdown=120)

@shared_task
def send_reading_reminder():
    """Send daily reading reminders to active users."""
    try:
        from datetime import datetime, timedelta
        
        # Find users who haven't read today
        yesterday = datetime.now() - timedelta(days=1)
        active_users = User.objects.filter(
            is_active=True,
            last_login__gte=yesterday
        )
        
        emails_sent = 0
        
        for user in active_users:
            # Check if they have any reading progress today
            from users.models import ReadingProgress
            today_progress = ReadingProgress.objects.filter(
                user=user,
                last_read_at__date=datetime.now().date()
            ).exists()
            
            if not today_progress:
                subject = "Daily Reading Reminder"
                message = f"""
                Hi {user.username},
                
                Haven't read today? There's new content waiting for you!
                
                Log in to continue your reading journey and maintain your streak.
                
                Happy reading!
                The Book of the Month Team
                """
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
                emails_sent += 1
        
        return f"Reading reminders sent to {emails_sent} users"
        
    except Exception as e:
        return f"Reading reminder failed: {str(e)}"