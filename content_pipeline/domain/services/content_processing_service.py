from dataclasses import replace
from typing import List, Optional
from datetime import datetime, timedelta
from content_pipeline.domain.entities import NewsEvent, Fact
from content_pipeline.domain.value_objects import Category, GeographicLocation, AgeRange
from content_pipeline.domain.ports.gemini_api_port import GeminiApiPort
from content_pipeline.domain.ports.image_generation_port import ImageGenerationPort
from content_pipeline.infrastructure.adapters.pexels_adapter import PexelsAdapter
from content_pipeline.infrastructure.adapters.youtube_adapter import YouTubeAdapter


class ContentProcessingService:
    def __init__(self, gemini_api: GeminiApiPort, image_generation: ImageGenerationPort,
                 pexels: PexelsAdapter = None, youtube: YouTubeAdapter = None):
        self.gemini_api = gemini_api
        self.image_generation = image_generation
        self.pexels = pexels
        self.youtube = youtube

    def categorize_event(self, event: NewsEvent) -> NewsEvent:
        category_name = self.gemini_api.categorize_content(event.title, event.raw_content)
        try:
            categories = [Category[category_name]]
        except KeyError:
            categories = [Category.SCIENCE_DISCOVERY]
        return replace(event, categories=categories)

    def ensure_geographic_diversity(self, events: List[NewsEvent]) -> List[NewsEvent]:
        return events

    def ensure_timeliness(self, event: NewsEvent, max_age_days: int = 7) -> bool:
        return (datetime.utcnow() - event.published_at) < timedelta(days=max_age_days)

    def adapt_content_for_age(self, event: NewsEvent, target_age_level: AgeRange = AgeRange.AGE_7_9) -> NewsEvent:
        adapted_content = self.gemini_api.adapt_content_for_age(event.raw_content, target_age_level.value)
        return replace(event, raw_content=adapted_content, age_appropriateness=target_age_level)

    def extract_facts(self, event: NewsEvent) -> NewsEvent:
        # Use Gemini to extract real educational facts instead of just copying the title
        context = self.gemini_api.generate_educational_context(event.title)
        if context:
            facts = [Fact(content=context, source=event.source_url, verification_status="UNVERIFIED")]
        else:
            facts = [Fact(content=event.title, source=event.source_url, verification_status="UNVERIFIED")]
        return replace(event, extracted_facts=facts)

    def extract_fun_facts(self, event: NewsEvent) -> NewsEvent:
        fun_facts = self.gemini_api.extract_fun_facts(event.raw_content)
        return replace(event, fun_facts=fun_facts)

    def verify_facts(self, event: NewsEvent) -> NewsEvent:
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

    def generate_comprehension_questions(self, content: str, num_questions: int = 3) -> List[str]:
        return self.gemini_api.generate_questions(content, num_questions)

    def filter_content_safety(self, content: str) -> bool:
        return self.gemini_api.filter_content_safety(content)

    def find_image(self, event: NewsEvent) -> Optional[str]:
        """Find a real photo using Pexels based on Gemini-suggested search terms."""
        if not self.pexels:
            return None
        search_terms = self.gemini_api.suggest_search_terms(event.title, event.raw_content)
        image_query = search_terms.get("image_query", event.title)
        return self.pexels.search_photo(image_query)

    def find_video(self, event: NewsEvent) -> Optional[str]:
        """Find an educational YouTube video based on Gemini-suggested search terms."""
        if not self.youtube:
            return None
        search_terms = self.gemini_api.suggest_search_terms(event.title, event.raw_content)
        youtube_query = search_terms.get("youtube_query", event.title)
        return self.youtube.search_video(youtube_query)

    def generate_image_for_event(self, event: NewsEvent) -> str:
        prompt = f"A child-friendly, educational illustration of: {event.title}"
        image_data = self.image_generation.generate_image(prompt=prompt)
        return image_data.get("image_path")
