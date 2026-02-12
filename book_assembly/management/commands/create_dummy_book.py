from django.core.management.base import BaseCommand
from content_pipeline.models import NewsEventModel
from book_assembly.models import MonthlyBookModel
import uuid
from datetime import date

class Command(BaseCommand):
    help = 'Creates a dummy book for demonstration purposes'

    def handle(self, *args, **options):
        self.stdout.write('Creating dummy book...')

        # Delete existing book for January 2026 to avoid unique constraint errors
        MonthlyBookModel.objects.filter(year=2026, month=1).delete()

        # Create dummy news events
        event_ids = []

        # Event 1
        event1_id = uuid.uuid4()
        NewsEventModel.objects.create(
            id=event1_id,
            title='The Amazing World of Butterflies',
            raw_content='This is a story about butterflies.',
            source_url='http://example.com/butterflies',
            published_at='2026-01-01T12:00:00Z',
            content_elements=[
                {'type': 'paragraph', 'payload': {'text': 'Butterflies are beautiful insects, known for their colorful wings and delicate flight. They start their lives as caterpillars and undergo a fascinating transformation.'}},
                {'type': 'image_gallery', 'payload': {'images': [
                    {'url': 'https://i.natgeofe.com/n/d9fc6711-b054-4171-8975-675e2971804f/monarch-butterfly-on-flower_3x2.jpg', 'caption': 'A monarch butterfly resting on a flower, showcasing its vibrant orange and black wings.'},
                    {'url': 'https://www.nwf.org/-/media/NEW-WEBSITE/Shared-Folder/Wildlife/Insects/insect_monarch-butterfly-on-flower_credit-Linda-Freshwaters-Arndt_600x300.ashx', 'caption': 'Another monarch butterfly in a garden, collecting nectar.'},
                ]}},
                {'type': 'paragraph', 'payload': {'text': 'They play an important role in pollinating plants, helping flowers and crops grow. There are thousands of different species of butterflies all over the world!'}},
            ],
            extracted_facts=['Butterflies undergo metamorphosis.', 'They are important pollinators.'],
            discussion_questions=['What is your favorite type of butterfly?', 'Why are butterflies important for plants?']
        )
        event_ids.append(str(event1_id))

        # Event 2
        event2_id = uuid.uuid4()
        NewsEventModel.objects.create(
            id=event2_id,
            title='Journey to the Great Barrier Reef',
            raw_content='This is a story about the Great Barrier Reef.',
            source_url='http://example.com/reef',
            published_at='2026-01-02T12:00:00Z',
            content_elements=[
                {'type': 'paragraph', 'payload': {'text': 'The Great Barrier Reef, located off the coast of Queensland, Australia, is the world\'s largest coral reef system. It\'s so big, you can even see it from space!'}},
                {'type': 'image_gallery', 'payload': {'images': [
                    {'url': 'https://i.natgeofe.com/n/e2b65029-169b-4a87-a35b-179ce2f8832a/01-great-barrier-reef-book-talk.jpg', 'caption': 'An aerial view of the colorful Great Barrier Reef.'},
                    {'url': 'https://assets.bouldercounty.gov/wp-content/uploads/2017/03/coral-reef-fish-swimming.jpg', 'caption': 'Tropical fish swimming among corals in the Great Barrier Reef.'},
                ]}},
                {'type': 'paragraph', 'payload': {'text': 'It is home to countless species of colorful fish, sharks, turtles, and other marine animals. Coral reefs are like underwater cities, providing shelter and food for many creatures.'}},
            ],
            extracted_facts=['The Great Barrier Reef is visible from space.', 'Coral reefs are vital ecosystems.'],
            discussion_questions=['What animals would you like to see in a coral reef?', 'Why is it important to protect coral reefs?']
        )
        event_ids.append(str(event2_id))

        # Event 3
        event3_id = uuid.uuid4()
        NewsEventModel.objects.create(
            id=event3_id,
            title='The Mysteries of Ancient Egypt',
            raw_content='Discover the secrets of pharaohs and pyramids.',
            source_url='http://example.com/egypt',
            published_at='2026-01-03T12:00:00Z',
            content_elements=[
                {'type': 'paragraph', 'payload': {'text': 'Ancient Egypt was a fascinating civilization that lived thousands of years ago. They built enormous pyramids and temples, and their pharaohs were considered gods.'}},
                {'type': 'image_gallery', 'payload': {'images': [
                    {'url': 'https://kids.nationalgeographic.com/content/dam/kids/photos/articles/History/A-G/ancient-egypt-pyramid.adapt.1900.1.jpg', 'caption': 'The Great Pyramid of Giza.'},
                    {'url': 'https://www.worldhistory.org/img/c/p/1200x627/14605.jpg', 'caption': 'Hieroglyphs on an ancient Egyptian temple wall.'},
                ]}},
                {'type': 'paragraph', 'payload': {'text': 'They developed a unique writing system called hieroglyphs and had many interesting beliefs about the afterlife. Archeologists are still discovering new things about them today!'}},
            ],
            extracted_facts=['Ancient Egyptians built pyramids.', 'Hieroglyphs were their writing system.'],
            discussion_questions=['If you could visit ancient Egypt, what would you want to see?', 'What do you think is the most interesting thing about ancient Egypt?']
        )
        event_ids.append(str(event3_id))

        # Event 4
        event4_id = uuid.uuid4()
        NewsEventModel.objects.create(
            id=event4_id,
            title='Inventors and Their Incredible Machines',
            raw_content='Learn about some amazing inventions that changed the world.',
            source_url='http://example.com/inventions',
            published_at='2026-01-04T12:00:00Z',
            content_elements=[
                {'type': 'paragraph', 'payload': {'text': 'Throughout history, brilliant inventors have come up with ideas that have transformed our lives. From the light bulb to the internet, inventions make our world easier and more fun.'}},
                {'type': 'image_gallery', 'payload': {'images': [
                    {'url': 'https://www.history.com/.image/ar_16:9%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cc_fill%2Cg_faces:auto%2Cq_auto:good%2Cw_768/MTY4NjQ3ODIyMzcyNDQxNTkz/thomas-edison-gettyimages-517855026.jpg', 'caption': 'Thomas Edison with a light bulb.'},
                    {'url': 'https://cdn.britannica.com/71/107571-050-745EC920/Wright-brothers-flight-Wright-Flyer-Kitty-Hawk-NC-December-17-1903.jpg', 'caption': 'The Wright brothers\' first flight.'},
                ]}},
                {'type': 'paragraph', 'payload': {'text': 'Many inventions started with a simple idea and a lot of hard work. What new inventions do you dream of creating?'}},
            ],
            extracted_facts=['Inventions have changed our lives.', 'Many inventors worked hard to realize their ideas.'],
            discussion_questions=['What invention do you think is the most important?', 'If you could invent anything, what would it be?']
        )
        event_ids.append(str(event4_id))

        # Event 5
        event5_id = uuid.uuid4()
        NewsEventModel.objects.create(
            id=event5_id,
            title='Exploring the Solar System',
            raw_content='A journey through planets, stars, and galaxies.',
            source_url='http://example.com/space',
            published_at='2026-01-05T12:00:00Z',
            content_elements=[
                {'type': 'paragraph', 'payload': {'text': 'Our solar system is a vast and wondrous place, filled with planets, moons, asteroids, and comets. Our home planet, Earth, is just one small part of it!'}},
                {'type': 'image_gallery', 'payload': {'images': [
                    {'url': 'https://science.nasa.gov/-/media/feature/nasa_og_image.png?h=630&w=1200&hash=D0E6023F07B576082F2F2D4897B2A10D', 'caption': 'An artistic representation of the solar system.'},
                    {'url': 'https://www.nasa.gov/wp-content/uploads/2023/11/53298284691_4a82208a0d_o.jpg', 'caption': 'A close-up view of Jupiter.'},
                ]}},
                {'type': 'paragraph', 'payload': {'text': 'Scientists use powerful telescopes and spacecraft to learn more about distant planets and stars. Maybe one day, you\'ll be an astronaut exploring new worlds!'}},
            ],
            extracted_facts=['Our solar system has planets, moons, and more.', 'Telescopes help us explore space.'],
            discussion_questions=['What is your favorite planet and why?', 'Would you like to travel to space? Where would you go?']
        )
        event_ids.append(str(event5_id))

        # Create a dummy monthly book with a quiz and parent's guide
        MonthlyBookModel.objects.create(
            title='January 2026: A World of Wonders',
            month=1,
            year=2026,
            cover_image_url='https://cdn.mos.cms.futurecdn.net/Q6nJq42P43c9F8QdY2z4P-1200-80.jpg',
            daily_entries=event_ids,
            end_of_month_quiz={
                'title': 'Test Your Knowledge!',
                'questions': [
                    {
                        'question_text': 'What do butterflies do for plants?',
                        'options': ['Eat them', 'Pollinate them', 'Hide from them'],
                        'correct_answer': 'Pollinate them'
                    },
                    {
                        'question_text': 'What is the Great Barrier Reef?',
                        'options': ['A big rock', 'A coral reef system', 'A type of fish'],
                        'correct_answer': 'A coral reef system'
                    },
                    {
                        'question_text': 'What did ancient Egyptians use for writing?',
                        'options': ['Alphabets', 'Hieroglyphs', 'Emojis'],
                        'correct_answer': 'Hieroglyphs'
                    },
                ]
            },
            parents_guide='This month\'s book introduces children to various wonders of the world, from the life cycle of butterflies to the vastness of our solar system. Discussion questions are provided to encourage critical thinking and conversation. Remember to engage with your child about what they\'ve learned!'
        )

        self.stdout.write(self.style.SUCCESS('Successfully created dummy book'))
