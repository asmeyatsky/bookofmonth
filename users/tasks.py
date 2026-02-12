# Background Tasks for django-q2
#
# These are plain functions scheduled via django-q2's Q_CLUSTER.
# Use `async_task('users.tasks.function_name', ...)` to queue them,
# or configure schedules via Q_CLUSTER settings or Django admin.

import logging
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


def send_welcome_email(user_id):
    """Send welcome email to new user."""
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

    logger.info("Welcome email sent to %s", user.email)
    return f"Welcome email sent to {user.email}"


def process_daily_content():
    """Process and ingest daily news content."""
    from content_pipeline.application.use_cases.ingest_news_events_use_case import IngestNewsEventsUseCase
    from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository

    repository = DjangoNewsEventRepository()
    use_case = IngestNewsEventsUseCase(repository)

    result = use_case.execute(days_back=1)

    count = result.get('events_processed', 0)
    logger.info("Processed %d news events", count)
    return f"Processed {count} news events"


def generate_monthly_book(year=None, month=None):
    """Generate monthly book and associated content."""
    from datetime import datetime

    if year is None or month is None:
        today = datetime.now()
        if today.month == 1:
            year = today.year - 1
            month = 12
        else:
            year = today.year
            month = today.month - 1

    logger.info("Book generation initiated for %d/%d", month, year)
    return f"Book generation initiated for {month}/{year}"


def cleanup_old_sessions():
    """Clean up expired sessions and temporary data."""
    from django.contrib.sessions.models import Session
    from datetime import datetime, timedelta

    cutoff_date = datetime.now() - timedelta(days=30)
    deleted_count = Session.objects.filter(expire_date__lt=cutoff_date).delete()[0]

    logger.info("Cleaned up %d old sessions", deleted_count)
    return f"Cleaned up {deleted_count} old sessions"


def update_user_achievements_batch(user_ids):
    """Update achievements for a batch of users."""
    from .services import AchievementService

    updated_count = 0
    for user_id in user_ids:
        user = User.objects.get(id=user_id)
        AchievementService.update_reading_streak(user)
        updated_count += 1

    logger.info("Updated achievements for %d users", updated_count)
    return f"Updated achievements for {updated_count} users"


def send_reading_reminder():
    """Send daily reading reminders to active users."""
    from datetime import datetime, timedelta

    yesterday = datetime.now() - timedelta(days=1)
    active_users = User.objects.filter(
        is_active=True,
        last_login__gte=yesterday
    )

    emails_sent = 0

    for user in active_users:
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

    logger.info("Reading reminders sent to %d users", emails_sent)
    return f"Reading reminders sent to {emails_sent} users"
