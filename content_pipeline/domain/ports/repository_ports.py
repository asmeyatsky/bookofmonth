from abc import ABC, abstractmethod
from typing import List, Optional
from content_pipeline.domain.entities import NewsEvent

class NewsEventRepositoryPort(ABC):
    @abstractmethod
    def get_by_id(self, event_id: str) -> Optional[NewsEvent]:
        pass

    @abstractmethod
    def save(self, news_event: NewsEvent) -> None:
        pass

    @abstractmethod
    def get_events_for_processing(self) -> List[NewsEvent]:
        pass

    @abstractmethod
    def update_processing_status(self, event_id: str, status: str) -> None:
        pass
