from django.core.management.base import BaseCommand
from content_pipeline.models import NewsEventModel


class Command(BaseCommand):
    help = 'Delete all existing stories and re-ingest fresh content.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--query',
            type=str,
            default='world news for children',
        )
        parser.add_argument(
            '--days-ago',
            type=int,
            default=3,
        )

    def handle(self, *args, **options):
        count = NewsEventModel.objects.count()
        NewsEventModel.objects.all().delete()
        self.stdout.write(f"Deleted {count} existing stories.")

        from django.core.management import call_command
        call_command('ingest_news', query=options['query'], days_ago=options['days_ago'])
