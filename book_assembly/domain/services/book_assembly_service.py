from typing import List
import random
from datetime import datetime
from book_assembly.domain.entities import MonthlyBook
from content_pipeline.domain.entities import NewsEvent
from content_pipeline.domain.ports.repository_ports import NewsEventRepositoryPort
from content_pipeline.domain.value_objects import Category

class BookAssemblyService:
    def __init__(self, news_event_repository: NewsEventRepositoryPort):
        self.news_event_repository = news_event_repository

    def assemble_book_for_month(self, year: int, month: int) -> MonthlyBook:
        if hasattr(self.news_event_repository, 'get_events_for_month'):
            events_for_month = self.news_event_repository.get_events_for_month(year, month)
        else:
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
        """Generate meaningful quiz questions based on news events."""
        if not events:
            return []
        
        quiz_questions = []
        
        # Select diverse events for quiz
        quiz_events = random.sample(events, min(5, len(events)))
        
        for event in quiz_events:
            question_types = [
                self._create_topic_question(event),
                self._create_fact_question(event),
                self._create_category_question(event),
                self._create_location_question(event)
            ]
            
            # Choose random question type
            question = random.choice([q for q in question_types if q])
            if question:
                quiz_questions.append(question)
        
        return quiz_questions[:10]  # Max 10 questions
    
    def _create_topic_question(self, event: NewsEvent) -> dict:
        """Create a question about the main topic/event."""
        options = [event.title]
        
        # Generate plausible distractors from similar events or categories
        if event.categories:
            category_questions = {
                Category.ANIMALS_NATURE: ["Wildlife Discovery", "Animal Rescue", "Forest Protection"],
                Category.SCIENCE_DISCOVERY: ["Scientific Breakthrough", "Research Findings", "Lab Discovery"],
                Category.SPACE_EARTH: ["Space Mission", "Astronomical Event", "Earth Observation"],
                Category.TECHNOLOGY_INNOVATION: ["Tech Launch", "Innovation Award", "Digital Breakthrough"],
                Category.SPORTS_HUMAN_ACHIEVEMENT: ["Sports Victory", "World Record", "Achievement Award"],
                Category.ARTS_CULTURE: ["Art Exhibition", "Cultural Festival", "Creative Performance"],
                Category.WORLD_RECORDS_FUN_FACTS: ["World Record", "Amazing Fact", "Incredible Discovery"]
            }
            
            distractors = category_questions.get(event.categories[0], ["Amazing Discovery", "Breaking News", "Latest Update"])
            options.extend(distractors[:3])
        else:
            options.extend(["Breaking News", "Latest Update", "New Discovery"])
        
        random.shuffle(options)
        
        return {
            "question": f"What was the main topic of the news event on {event.published_at.strftime('%B %d')}?",
            "options": options[:4],
            "answer": event.title,
            "type": "multiple_choice"
        }
    
    def _create_fact_question(self, event: NewsEvent) -> dict:
        """Create a question based on extracted facts."""
        if not event.extracted_facts:
            return None
        
        fact = random.choice(event.extracted_facts)
        question_text = f"According to the news about {event.title[:30]}..."
        
        return {
            "question": f"{question_text} What is true about this event?",
            "options": [fact.content, "This is incorrect information", "That never happened", "The opposite is true"],
            "answer": fact.content,
            "type": "fact_based"
        }
    
    def _create_category_question(self, event: NewsEvent) -> dict:
        """Create a question about the event category."""
        if not event.categories:
            return None
            
        category = event.categories[0]
        all_categories = [cat.value for cat in Category]
        distractors = [cat for cat in all_categories if cat != category.value]
        random.shuffle(distractors)
        
        return {
            "question": f"Which category does the news event '{event.title[:40]}...' belong to?",
            "options": [category.value] + distractors[:3],
            "answer": category.value,
            "type": "category"
        }
    
    def _create_location_question(self, event: NewsEvent) -> dict:
        """Create a question about geographic location."""
        if not event.geographic_locations:
            return None
            
        location = event.geographic_locations[0]
        locations = [location.country, location.city or location.country]
        other_locations = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France"]
        distractors = [loc for loc in other_locations if loc not in locations]
        random.shuffle(distractors)
        
        return {
            "question": f"Where did the news event '{event.title[:30]}...' take place?",
            "options": locations + distractors[:2],
            "answer": location.country,
            "type": "geography"
        }

    def _generate_parents_guide(self, events: List[NewsEvent]) -> str:
        """Generate a comprehensive parent's guide."""
        if not events:
            return "No content available for this month's book."
        
        # Analyze content themes
        categories_count = {}
        locations = set()
        age_ranges = set()
        
        for event in events:
            for category in event.categories:
                categories_count[category.value] = categories_count.get(category.value, 0) + 1
            
            for location in event.geographic_locations:
                locations.add(location.country)
            
            if event.age_appropriateness:
                age_ranges.add(event.age_appropriateness.value)
        
        # Generate guide sections
        guide_sections = []
        
        # Main themes
        if categories_count:
            main_categories = sorted(categories_count.items(), key=lambda x: x[1], reverse=True)[:3]
            themes_text = ", ".join([cat for cat, count in main_categories])
            guide_sections.append(f"**Main Topics**: {themes_text}")
        
        # Geographic diversity
        if locations:
            locations_text = ", ".join(sorted(list(locations))[:5])
            guide_sections.append(f"**Global Perspective**: Events from {locations_text} help your child understand our interconnected world.")
        
        # Age appropriateness
        if age_ranges:
            age_text = ", ".join(sorted(list(age_ranges)))
            guide_sections.append(f"**Age Level**: Content is appropriate for ages {age_text}")
        
        # Discussion questions
        discussion_questions = self._generate_discussion_questions(events)
        if discussion_questions:
            guide_sections.append("**Discussion Questions:**")
            for i, question in enumerate(discussion_questions, 1):
                guide_sections.append(f"{i}. {question}")
        
        # Learning activities
        activities = self._generate_learning_activities(categories_count.keys())
        if activities:
            guide_sections.append("**Learning Activities:**")
            for i, activity in enumerate(activities, 1):
                guide_sections.append(f"• {activity}")
        
        # Safety note
        guide_sections.append("**Note for Parents**: This content has been reviewed for age-appropriateness. Encourage questions and explore topics further based on your child's interests.")
        
        return "\n\n".join(guide_sections)
    
    def _generate_discussion_questions(self, events: List[NewsEvent]) -> List[str]:
        """Generate discussion questions for parents and children."""
        questions = []
        
        if not events:
            return questions
        
        # General questions
        questions.extend([
            "Which news story interested you the most and why?",
            "What did you learn that surprised you?",
            "How do these events connect to our daily life?",
            "What questions do you have after reading these stories?"
        ])
        
        # Category-specific questions
        categories = set()
        for event in events:
            categories.update(event.categories)
        
        category_questions = {
            Category.SCIENCE_DISCOVERY: "What scientific discovery could help solve a problem you've noticed?",
            Category.ANIMALS_NATURE: "How can we help protect animals and their habitats?",
            Category.SPACE_EARTH: "If you could visit any place mentioned, where would you go?",
            Category.TECHNOLOGY_INNOVATION: "How might this technology change how we live or learn?",
            Category.SPORTS_HUMAN_ACHIEVEMENT: "What achievement inspires you to work toward your goals?",
            Category.ARTS_CULTURE: "How do different forms of art help us understand each other?",
            Category.WORLD_RECORDS_FUN_FACTS: "What amazing fact would you like to share with friends?"
        }
        
        for category in categories:
            if category in category_questions:
                questions.append(category_questions[category])
        
        return questions[:6]  # Limit to 6 questions
    
    def _generate_learning_activities(self, categories) -> List[str]:
        """Generate learning activities based on content categories."""
        activities = []
        
        category_mapping = {
            "Animals & Nature": [
                "Create a drawing of your favorite animal from this month",
                "Start a nature journal and record 3 interesting things you observe"
            ],
            "Science & Discovery": [
                "Try a simple science experiment at home with adult supervision",
                "Research one scientific discovery further and share what you learned"
            ],
            "Space & Earth": [
                "Look at the night sky and try to identify constellations",
                "Create a model of the solar system using household items"
            ],
            "Technology & Innovation": [
                "Design your own invention to solve a common problem",
                "Interview a family member about technology changes they've experienced"
            ],
            "Sports & Human Achievement": [
                "Set a small, achievable goal and track your progress",
                "Learn about a sports team or athlete from another country"
            ],
            "Arts & Culture": [
                "Create artwork inspired by a cultural event you read about",
                "Learn a few words in a language mentioned in the articles"
            ],
            "World Records & Fun Facts": [
                "Find an interesting fact to share at dinner tonight",
                "Try to break a personal 'record' for something you enjoy"
            ]
        }
        
        for category in categories:
            if category in category_mapping:
                activities.extend(category_mapping[category][:1])  # One activity per category
        
        return activities[:4]  # Limit to 4 activities
