"""
Management command to run a task function by dotted path.

Used by Cloud Run Jobs to execute scheduled tasks without a persistent
qcluster worker. Each job boots a container, runs the task, and exits.

Usage:
    python manage.py run_task users.tasks.process_daily_content
    python manage.py run_task users.tasks.send_reading_reminder
"""

import importlib
import sys

from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Run a task function by its dotted Python path"

    def add_arguments(self, parser):
        parser.add_argument(
            "task_path",
            type=str,
            help="Dotted path to the task function (e.g. users.tasks.process_daily_content)",
        )

    def handle(self, *args, **options):
        task_path = options["task_path"]

        # Split into module path and function name
        parts = task_path.rsplit(".", 1)
        if len(parts) != 2:
            raise CommandError(
                f"Invalid task path '{task_path}'. Use format: module.path.function_name"
            )

        module_path, func_name = parts

        # Only allow tasks from known app modules
        allowed_prefixes = ("users.tasks", "content_pipeline.tasks", "book_assembly.tasks", "quizzes.tasks")
        if not any(task_path.startswith(prefix) for prefix in allowed_prefixes):
            raise CommandError(
                f"Task path '{task_path}' is not in an allowed module. "
                f"Allowed prefixes: {', '.join(allowed_prefixes)}"
            )

        try:
            module = importlib.import_module(module_path)
        except ImportError as e:
            raise CommandError(f"Could not import module '{module_path}': {e}")

        func = getattr(module, func_name, None)
        if func is None:
            raise CommandError(f"Function '{func_name}' not found in module '{module_path}'")

        if not callable(func):
            raise CommandError(f"'{task_path}' is not callable")

        self.stdout.write(f"Running task: {task_path}")
        try:
            func()
            self.stdout.write(self.style.SUCCESS(f"Task '{task_path}' completed successfully"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Task '{task_path}' failed: {e}"))
            sys.exit(1)
