from dataclasses import dataclass
from enum import Enum

class Category(Enum):
    ANIMALS_NATURE = "Animals & Nature"
    SCIENCE_DISCOVERY = "Science & Discovery"
    SPACE_EARTH = "Space & Earth"
    TECHNOLOGY_INNOVATION = "Technology & Innovation"
    SPORTS_HUMAN_ACHIEVEMENT = "Sports & Human Achievement"
    ARTS_CULTURE = "Arts & Culture"
    WORLD_RECORDS_FUN_FACTS = "World Records & Fun Facts"

class AgeRange(Enum):
    AGE_4_6 = "4-6"
    AGE_7_9 = "7-9"
    AGE_10_12 = "10-12"

@dataclass(frozen=True)
class Fact:
    content: str
    source: str
    verification_status: str

@dataclass(frozen=True)
class GeographicLocation:
    country: str
    continent: str
    city: str = None
