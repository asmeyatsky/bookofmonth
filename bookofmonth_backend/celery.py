# Celery Configuration

import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookofmonth_backend.settings')

app = Celery('bookofmonth_backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure Celery Beat scheduler
app.conf.beat_scheduler = 'django_celery_beat.schedulers:DatabaseScheduler'

# Task settings
app.conf.task_serializer = 'json'
app.conf.result_serializer = 'json'
app.conf.accept_content = ['json']
app.conf.result_expires = 60 * 60 * 24  # 1 day
app.conf.timezone = 'UTC'
app.conf.enable_utc = True

# Task routing for different types of tasks
app.conf.task_routes = {
    'content_pipeline.tasks.*': {'queue': 'content_processing'},
    'users.tasks.*': {'queue': 'user_actions'},
    'book_assembly.tasks.*': {'queue': 'book_generation'},
}

# Error handling and retries
app.conf.task_reject_on_worker_lost = True
app.conf.task_acks_late = True
app.conf.task_default_max_retries = 3
app.conf.task_default_retry_delay = 60  # 1 minute