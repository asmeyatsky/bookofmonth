from abc import ABC, abstractmethod
from typing import List, Optional
import uuid
from book_assembly.domain.entities import MonthlyBook

class MonthlyBookRepositoryPort(ABC):
    @abstractmethod
    def get_by_id(self, book_id: uuid.UUID) -> Optional[MonthlyBook]:
        pass

    @abstractmethod
    def save(self, monthly_book: MonthlyBook) -> None:
        pass

    @abstractmethod
    def get_books_by_year(self, year: int) -> List[MonthlyBook]:
        pass

    @abstractmethod
    def get_book_for_month(self, year: int, month: int) -> Optional[MonthlyBook]:
        pass
