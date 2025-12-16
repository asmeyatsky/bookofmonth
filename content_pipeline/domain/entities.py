from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from content_pipeline.domain.value_objects import Category, AgeRange, Fact, GeographicLocation

@dataclass(frozen=True)
class NewsEvent:
    id: str
    title: str
    raw_content: str
    source_url: str
    published_at: datetime
    extracted_facts: List[Fact] = field(default_factory=list)
    categories: List[Category] = field(default_factory=list)
    geographic_locations: List[GeographicLocation] = field(default_factory=list)
    age_appropriateness: Optional[AgeRange] = None
    is_verified: bool = False
    processing_status: str = "RAW" # e.g., RAW, CATEGORIZED, VERIFIED, ADAPTED
    image_path: Optional[str] = None # New field for image path
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
