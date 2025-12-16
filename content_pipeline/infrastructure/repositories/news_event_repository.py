from typing import List, Optional
from content_pipeline.domain.ports.repository_ports import NewsEventRepositoryPort
from content_pipeline.domain.entities import NewsEvent
from content_pipeline.domain.value_objects import Category, Fact, GeographicLocation, AgeRange
from content_pipeline.models import NewsEventModel
import json

class DjangoNewsEventRepository(NewsEventRepositoryPort):
    def _to_domain_entity(self, model: NewsEventModel) -> NewsEvent:
        return NewsEvent(
            id=str(model.id),
            title=model.title,
            raw_content=model.raw_content,
            source_url=model.source_url,
            published_at=model.published_at,
            extracted_facts=[Fact(**f) for f in model.extracted_facts] if model.extracted_facts else [],
            categories=[Category[c] for c in model.categories] if model.categories else [],
            geographic_locations=[GeographicLocation(**loc) for loc in model.geographic_locations] if model.geographic_locations else [],
            age_appropriateness=AgeRange[model.age_appropriateness] if model.age_appropriateness else None,
            is_verified=model.is_verified,
            processing_status=model.processing_status,
            image_path=model.image_path,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def _to_orm_model(self, entity: NewsEvent) -> NewsEventModel:
        try:
            model = NewsEventModel.objects.get(id=entity.id)
        except NewsEventModel.DoesNotExist:
            model = NewsEventModel(id=entity.id)

        model.title = entity.title
        model.raw_content = entity.raw_content
        model.source_url = entity.source_url
        model.published_at = entity.published_at
        model.extracted_facts = [f.__dict__ for f in entity.extracted_facts] if entity.extracted_facts else []
        model.categories = [c.name for c in entity.categories] if entity.categories else []
        model.geographic_locations = [loc.__dict__ for loc in entity.geographic_locations] if entity.geographic_locations else []
        model.age_appropriateness = entity.age_appropriateness.name if entity.age_appropriateness else None
        model.is_verified = entity.is_verified
        model.processing_status = entity.processing_status
        model.image_path = entity.image_path
        # created_at and updated_at are auto_now_add and auto_now respectively in the model
        # so they don't need to be set here for updates.
        return model

    def get_by_id(self, event_id: str) -> Optional[NewsEvent]:
        try:
            model = NewsEventModel.objects.get(id=event_id)
            return self._to_domain_entity(model)
        except NewsEventModel.DoesNotExist:
            return None

    def save(self, news_event: NewsEvent) -> None:
        model = self._to_orm_model(news_event)
        model.save()

    def get_events_for_processing(self) -> List[NewsEvent]:
        # Example: get events that are raw or need reprocessing
        models = NewsEventModel.objects.filter(processing_status__in=["RAW", "PENDING_REPROCESS"]).order_by('published_at')
        return [self._to_domain_entity(model) for model in models]

    def update_processing_status(self, event_id: str, status: str) -> None:
        NewsEventModel.objects.filter(id=event_id).update(processing_status=status)
