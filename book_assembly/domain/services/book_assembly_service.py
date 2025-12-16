from typing import List
from datetime import datetime
from backend.book_assembly.domain.entities import MonthlyBook
from backend.content_pipeline.domain.entities import NewsEvent
from backend.content_pipeline.domain.ports.repository_ports import NewsEventRepositoryPort

class BookAssemblyService:
    def __init__(self, news_event_repository: NewsEventRepositoryPort):
        self.news_event_repository = news_event_repository

    def assemble_book_for_month(self, year: int, month: int) -> MonthlyBook:
        # Fetch all processed news events for the given month and year
        # This is a placeholder for a more sophisticated query
        all_events = self.news_event_repository.get_events_for_processing()
        events_for_month = [
            event for event in all_events
            if event.published_at.year == year and event.published_at.month == month
        ]

        # Create a MonthlyBook
        monthly_book = MonthlyBook(
            month=month,
            year=year,
            title=f"Book of the Month: {datetime(year, month, 1).strftime('%B %Y')}",
            cover_image_url=f"https://picsum.photos/seed/{year}-{month}/800/600",
            daily_entries=events_for_month,
            end_of_month_quiz=self._generate_quiz(events_for_month),
            parents_guide=self._generate_parents_guide(events_for_month)
        )
        return monthly_book

    def _generate_quiz(self, events: List[NewsEvent]) -> List[dict]:
        # Placeholder for quiz generation logic
        return [
            {"question": f"What was the main topic of the event on {event.published_at.day}?", "answer": event.title}
            for event in events[:3] # Quiz on the first 3 events
        ]

    def _generate_parents_guide(self, events: List[NewsEvent]) -> str:
        # Placeholder for parent's guide generation logic
        topics = ", ".join(set(category.value for event in events for category in event.categories))
        return f"This month's book covered topics like: {topics}. Talk to your child about what they learned!"
