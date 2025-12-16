from django.core.management.base import BaseCommand
from datetime import datetime

from backend.book_assembly.infrastructure.repositories.monthly_book_repository import DjangoMonthlyBookRepository
from backend.book_assembly.domain.services.book_assembly_service import BookAssemblyService
from backend.book_assembly.application.use_cases.assemble_book_use_case import AssembleBookUseCase
from backend.content_pipeline.infrastructure.repositories.news_event_repository import DjangoNewsEventRepository

class Command(BaseCommand):
    help = 'Assembles a monthly book from processed news events.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            help='Year of the book to assemble.',
            default=datetime.now().year,
        )
        parser.add_argument(
            '--month',
            type=int,
            help='Month of the book to assemble.',
            default=datetime.now().month,
        )

    def handle(self, *args, **options):
        self.stdout.write("Starting book assembly process...")

        year = options['year']
        month = options['month']

        # Initialize repositories
        news_event_repository = DjangoNewsEventRepository()
        monthly_book_repository = DjangoMonthlyBookRepository()

        # Initialize domain service
        book_assembly_service = BookAssemblyService(news_event_repository=news_event_repository)

        # Initialize application use case
        assemble_use_case = AssembleBookUseCase(
            book_assembly_service=book_assembly_service,
            monthly_book_repository=monthly_book_repository
        )

        assemble_use_case.execute(year=year, month=month)

        self.stdout.write(self.style.SUCCESS(f'Book for {month}/{year} assembled successfully!'))
