from dataclasses import replace
from typing import List
from datetime import datetime, timedelta

from content_pipeline.domain.ports.external_service_ports import NewsAggregatorPort, RawNewsArticle
from content_pipeline.domain.ports.repository_ports import NewsEventRepositoryPort
from content_pipeline.domain.ports.gemini_api_port import GeminiApiPort
from content_pipeline.domain.ports.image_generation_port import ImageGenerationPort
from content_pipeline.domain.services.content_processing_service import ContentProcessingService
from content_pipeline.domain.entities import NewsEvent
from content_pipeline.domain.value_objects import AgeRange

class IngestNewsEventsUseCase:
    def __init__(
        self,
        news_aggregator: NewsAggregatorPort,
        news_event_repository: NewsEventRepositoryPort,
        content_processing_service: ContentProcessingService,
        gemini_api: GeminiApiPort,
        image_generation: ImageGenerationPort
    ):
        self.news_aggregator = news_aggregator
        self.news_event_repository = news_event_repository
        self.content_processing_service = content_processing_service
        self.gemini_api = gemini_api
        self.image_generation = image_generation

    def execute(self, query: str, days_ago: int = 1, target_age_level: AgeRange = AgeRange.AGE_7_9):
        self.content_processing_service.gemini_api = self.gemini_api
        self.content_processing_service.image_generation = self.image_generation

        since_date = datetime.utcnow() - timedelta(days=days_ago)
        raw_articles: List[RawNewsArticle] = self.news_aggregator.fetch_recent_news(query, since_date)

        for article in raw_articles:
            if not self.content_processing_service.filter_content_safety(article.content):
                print(f"Skipping unsafe content: {article.title}")
                continue

            news_event = NewsEvent(
                id=str(hash(article.url)),
                title=article.title,
                raw_content=article.content,
                source_url=article.url,
                published_at=article.published_at,
            )

            processed_event = self.content_processing_service.categorize_event(news_event)
            processed_event = self.content_processing_service.determine_age_appropriateness(processed_event, target_age_level)
            processed_event = self.content_processing_service.extract_facts(processed_event)
            processed_event = self.content_processing_service.verify_facts(processed_event)
            
            image_path = self.content_processing_service.generate_image_for_event(processed_event)
            processed_event = replace(processed_event, image_path=image_path)

            if processed_event.extracted_facts:
                for fact in processed_event.extracted_facts:
                    educational_context = self.content_processing_service.generate_educational_context_for_fact(fact)
                    print(f"Generated context for '{fact.content}': {educational_context}")
            
            questions = self.content_processing_service.generate_comprehension_questions(processed_event.raw_content)
            print(f"Generated questions: {questions}")

            if not self.content_processing_service.ensure_timeliness(processed_event, max_age_days=days_ago + 1):
                print(f"Event {processed_event.title} is too old after processing, skipping.")
                continue

            final_event = replace(processed_event, processing_status="PROCESSED")
            self.news_event_repository.save(final_event)
            print(f"Processed and saved news event: {final_event.title}")
