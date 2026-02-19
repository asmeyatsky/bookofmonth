from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class GeminiApiPort(ABC):
    @abstractmethod
    def verify_fact(self, text: str) -> bool:
        """Verifies the accuracy of a given text."""
        pass

    @abstractmethod
    def adapt_content_for_age(self, content: str, age_level: str) -> str:
        """Adapts content for a specific age level (e.g., 4-6, 7-9, 10-12)."""
        pass

    @abstractmethod
    def generate_educational_context(self, fact: str) -> str:
        """Generates additional educational context for a given fact."""
        pass

    @abstractmethod
    def generate_questions(self, content: str, num_questions: int = 1) -> List[str]:
        """Generates comprehension or discussion questions based on content."""
        pass

    @abstractmethod
    def filter_content_safety(self, content: str) -> bool:
        """Filters content for inappropriate topics, returning True if safe, False otherwise."""
        pass

    @abstractmethod
    def extract_fun_facts(self, content: str) -> List[str]:
        """Generates 3-5 surprising, entertaining facts related to the topic."""
        pass

    @abstractmethod
    def suggest_search_terms(self, title: str, content: str) -> Dict[str, str]:
        """Suggests YouTube and image search queries for the topic."""
        pass

    @abstractmethod
    def categorize_content(self, title: str, content: str) -> str:
        """Categorizes content into one of the predefined categories using AI."""
        pass
