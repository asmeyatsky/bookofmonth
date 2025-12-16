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
