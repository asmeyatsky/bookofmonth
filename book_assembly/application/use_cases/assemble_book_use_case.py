from book_assembly.domain.services.book_assembly_service import BookAssemblyService
from book_assembly.domain.ports.repository_ports import MonthlyBookRepositoryPort

class AssembleBookUseCase:
    def __init__(
        self,
        book_assembly_service: BookAssemblyService,
        monthly_book_repository: MonthlyBookRepositoryPort
    ):
        self.book_assembly_service = book_assembly_service
        self.monthly_book_repository = monthly_book_repository

    def execute(self, year: int, month: int):
        # Assemble the book for the given month and year
        monthly_book = self.book_assembly_service.assemble_book_for_month(year, month)

        # Save the assembled book
        self.monthly_book_repository.save(monthly_book)
        print(f"Assembled and saved book: {monthly_book.title}")
