from abc import ABC, abstractmethod
from typing import Dict, Any

class ImageGenerationPort(ABC):
    @abstractmethod
    def generate_image(self, prompt: str, style: str = "child-friendly, educational") -> Dict[str, Any]:
        """Generates an image based on a given prompt and style.
        Returns a dictionary containing the image path and other metadata.
        """
        pass