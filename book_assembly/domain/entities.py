from dataclasses import dataclass, field
from datetime import datetime
from typing import List
from backend.content_pipeline.domain.entities import NewsEvent
import uuid

@dataclass
class MonthlyBook:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    month: int
    year: int
    title: str
    cover_image_url: str
    daily_entries: List[NewsEvent] = field(default_factory=list)
    end_of_month_quiz: List[dict] = field(default_factory=list) # List of questions and answers
    parents_guide: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
