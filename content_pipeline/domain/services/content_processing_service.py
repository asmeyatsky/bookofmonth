from dataclasses import replace
from typing import List
from datetime import datetime, timedelta
from content_pipeline.domain.entities import NewsEvent, Fact
from content_pipeline.domain.value_objects import Category, GeographicLocation, AgeRange
from content_pipeline.domain.ports.gemini_api_port import GeminiApiPort
from content_pipeline.domain.ports.image_generation_port import ImageGenerationPort

class ContentProcessingService:
    def __init__(self, gemini_api: GeminiApiPort, image_generation: ImageGenerationPort):
        self.gemini_api = gemini_api
        self.image_generation = image_generation

    def categorize_event(self, event: NewsEvent) -> NewsEvent:
        categories = []
        if "fish" in event.raw_content.lower() or "animal" in event.raw_content.lower():
            categories = [Category.ANIMALS_NATURE]
        elif "tech" in event.raw_content.lower() or "battery" in event.raw_content.lower():
            categories = [Category.TECHNOLOGY_INNOVATION]
        else:
            categories = [Category.SCIENCE_DISCOVERY] # Default
        return replace(event, categories=categories)

    def ensure_geographic_diversity(self, events: List[NewsEvent]) -> List[NewsEvent]:
        # Placeholder for logic to ensure events from different continents/countries
        # This might involve filtering or prioritizing based on existing events
        return events # No-op for now

    def ensure_timeliness(self, event: NewsEvent, max_age_days: int = 7) -> bool:
        # Check if the event is within the desired timeliness
        return (datetime.utcnow() - event.published_at) < timedelta(days=max_age_days)

    def determine_age_appropriateness(self, event: NewsEvent, target_age_level: AgeRange = AgeRange.AGE_7_9) -> NewsEvent:
        # Determine age appropriateness using Gemini API
        self.gemini_api.adapt_content_for_age(event.raw_content, target_age_level.value)
        return replace(event, age_appropriateness=target_age_level)

    def extract_facts(self, event: NewsEvent) -> NewsEvent:
        # Placeholder for AI/ML-driven fact extraction
        # For now, just create a dummy fact from the title
        facts = [Fact(content=event.title, source=event.source_url, verification_status="UNVERIFIED")]
        return replace(event, extracted_facts=facts)

    def verify_facts(self, event: NewsEvent) -> NewsEvent:
        # Use Gemini API for fact verification
        if not event.extracted_facts:
            return event

        verified_facts = []
        for fact in event.extracted_facts:
            is_verified = self.gemini_api.verify_fact(fact.content)
            verified_facts.append(replace(fact, verification_status="VERIFIED" if is_verified else "UNVERIFIED"))
        
        is_event_verified = all(f.verification_status == "VERIFIED" for f in verified_facts)
        return replace(event, extracted_facts=verified_facts, is_verified=is_event_verified)

    def generate_educational_context_for_fact(self, fact: Fact) -> str:
        return self.gemini_api.generate_educational_context(fact.content)

    def generate_comprehension_questions(self, content: str, num_questions: int = 2) -> List[str]:
        return self.gemini_api.generate_questions(content, num_questions)

    def filter_content_safety(self, content: str) -> bool:
        return self.gemini_api.filter_content_safety(content)

    def generate_image_for_event(self, event: NewsEvent) -> str:
        prompt = f"A child-friendly, educational illustration of: {event.title}"
        image_data = self.image_generation.generate_image(prompt=prompt)
        return image_data.get("image_path")

