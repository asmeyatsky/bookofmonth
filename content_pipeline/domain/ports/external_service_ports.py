from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List
from datetime import datetime
from content_pipeline.domain.entities import NewsEvent

@dataclass(frozen=True)
class RawNewsArticle:
    title: str
    content: str
    url: str
    published_at: datetime
    source_name: str

class NewsAggregatorPort(ABC):
    @abstractmethod
    def fetch_recent_news(self, query: str, since: datetime, language: str = "en") -> List[RawNewsArticle]:
        pass
