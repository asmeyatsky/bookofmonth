from django.core.management.base import BaseCommand
from datetime import datetime

from content_pipeline.infrastructure.adapters.news_api_adapter import NewsAPIAdapter
from content_pipeline.infrastructure.adapters.gemini_api_adapter import GeminiApiAdapter
from content_pipeline.infrastructure.adapters.image_generation_adapter import ImageGenerationAdapter # New import
from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository
from content_pipeline.domain.services.content_processing_service import ContentProcessingService
from content_pipeline.application.use_cases.ingest_news_events_use_case import IngestNewsEventsUseCase


class Command(BaseCommand):
    help = 'Ingests news events, processes them, and saves them to the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--query',
            type=str,
            help='Search query for news aggregation.',
            default='world news for children',
        )
        parser.add_argument(
            '--days-ago',
            type=int,
            help='Number of days ago to fetch news from.',
            default=1,
        )

    def handle(self, *args, **options):
        self.stdout.write("Starting news ingestion process...")

        # Initialize infrastructure components
        news_aggregator = NewsAPIAdapter()
        gemini_api = GeminiApiAdapter()
        image_generation = ImageGenerationAdapter()
        news_event_repository = DjangoNewsEventRepository()

        # Initialize domain service
        content_processing_service = ContentProcessingService(gemini_api=gemini_api, image_generation=image_generation)

        # Initialize application use case
        ingest_use_case = IngestNewsEventsUseCase(
            news_aggregator=news_aggregator,
            news_event_repository=news_event_repository,
            content_processing_service=content_processing_service,
            gemini_api=gemini_api,
            image_generation=image_generation
        )

        query = options['query']
        days_ago = options['days_ago']

        ingest_use_case.execute(query=query, days_ago=days_ago)

        self.stdout.write(self.style.SUCCESS('News ingestion process completed successfully!'))
