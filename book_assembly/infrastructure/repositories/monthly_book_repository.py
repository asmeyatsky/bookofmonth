from typing import List, Optional
import uuid
from book_assembly.domain.ports.repository_ports import MonthlyBookRepositoryPort
from book_assembly.domain.entities import MonthlyBook
from book_assembly.models import MonthlyBookModel
from content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository

class DjangoMonthlyBookRepository(MonthlyBookRepositoryPort):
    def __init__(self):
        self.news_event_repo = DjangoNewsEventRepository()

    def _to_domain_entity(self, model: MonthlyBookModel) -> MonthlyBook:
        daily_entries = [self.news_event_repo.get_by_id(event_id) for event_id in model.daily_entries]
        return MonthlyBook(
            id=model.id,
            month=model.month,
            year=model.year,
            title=model.title,
            cover_image_url=model.cover_image_url,
            daily_entries=[entry for entry in daily_entries if entry is not None],
            end_of_month_quiz=model.end_of_month_quiz,
            parents_guide=model.parents_guide,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def _to_orm_model(self, entity: MonthlyBook) -> MonthlyBookModel:
        try:
            model = MonthlyBookModel.objects.get(id=entity.id)
        except MonthlyBookModel.DoesNotExist:
            model = MonthlyBookModel(id=entity.id)

        model.month = entity.month
        model.year = entity.year
        model.title = entity.title
        model.cover_image_url = entity.cover_image_url
        model.daily_entries = [str(entry.id) for entry in entity.daily_entries]
        model.end_of_month_quiz = entity.end_of_month_quiz
        model.parents_guide = entity.parents_guide
        return model

    def get_by_id(self, book_id: uuid.UUID) -> Optional[MonthlyBook]:
        try:
            model = MonthlyBookModel.objects.get(id=book_id)
            return self._to_domain_entity(model)
        except MonthlyBookModel.DoesNotExist:
            return None

    def save(self, monthly_book: MonthlyBook) -> None:
        model = self._to_orm_model(monthly_book)
        model.save()

    def get_books_by_year(self, year: int) -> List[MonthlyBook]:
        models = MonthlyBookModel.objects.filter(year=year)
        return [self._to_domain_entity(model) for model in models]

    def get_book_for_month(self, year: int, month: int) -> Optional[MonthlyBook]:
        try:
            model = MonthlyBookModel.objects.get(year=year, month=month)
            return self._to_domain_entity(model)
        except MonthlyBookModel.DoesNotExist:
            return None
