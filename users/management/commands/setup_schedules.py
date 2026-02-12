"""
Management command to set up django-q2 scheduled tasks.
Run once after deployment: python manage.py setup_schedules
"""
from django.core.management.base import BaseCommand
from django_q.models import Schedule


class Command(BaseCommand):
    help = 'Set up django-q2 scheduled tasks (replaces Celery beat schedule)'

    def handle(self, *args, **options):
        schedules = [
            {
                'name': 'process-daily-content',
                'func': 'users.tasks.process_daily_content',
                'schedule_type': Schedule.CRON,
                'cron': '0 6 * * *',  # 6 AM UTC daily
            },
            {
                'name': 'send-reading-reminders',
                'func': 'users.tasks.send_reading_reminder',
                'schedule_type': Schedule.CRON,
                'cron': '0 18 * * *',  # 6 PM UTC daily
            },
            {
                'name': 'cleanup-old-sessions',
                'func': 'users.tasks.cleanup_old_sessions',
                'schedule_type': Schedule.CRON,
                'cron': '0 3 * * 0',  # 3 AM UTC on Sundays
            },
            {
                'name': 'generate-monthly-book',
                'func': 'users.tasks.generate_monthly_book',
                'schedule_type': Schedule.CRON,
                'cron': '0 0 1 * *',  # Midnight UTC on 1st of each month
            },
        ]

        for sched in schedules:
            obj, created = Schedule.objects.update_or_create(
                name=sched['name'],
                defaults={
                    'func': sched['func'],
                    'schedule_type': sched['schedule_type'],
                    'cron': sched['cron'],
                },
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {sched["name"]}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {len(schedules)} schedules configured. '
            f'Start the worker with: python manage.py qcluster'
        ))
