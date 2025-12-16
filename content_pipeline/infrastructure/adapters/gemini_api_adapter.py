import os
import requests
from typing import List, Dict, Any, Optional
from content_pipeline.domain.ports.gemini_api_port import GeminiApiPort
from content_pipeline.domain.value_objects import AgeRange

class GeminiApiAdapter(GeminiApiPort):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key not provided or set in environment.")
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

    def _call_gemini_api(self, prompt: str) -> Optional[str]:
        headers = {"Content-Type": "application/json"}
        data = {"contents": [{"parts": [{"text": prompt}]}]}
        params = {"key": self.api_key}
        try:
            response = requests.post(self.api_url, headers=headers, json=data, params=params)
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]
        except requests.exceptions.RequestException as e:
            print(f"Error calling Gemini API: {e}")
            return None
        except (KeyError, IndexError) as e:
            print(f"Error parsing Gemini API response: {e}")
            return None

    def verify_fact(self, text: str) -> bool:
        prompt = f"Is the following statement a verifiable fact? Answer with only 'true' or 'false'. Statement: {text}"
        response = self._call_gemini_api(prompt)
        return response.lower().strip() == 'true' if response else False

    def adapt_content_for_age(self, content: str, age_level: str) -> str:
        prompt = f"Adapt the following content for a child in the {age_level} age range:\n\n{content}"
        response = self._call_gemini_api(prompt)
        return response if response else content

    def generate_educational_context(self, fact: str) -> str:
        prompt = f"Provide a short, engaging educational context for the following fact: {fact}"
        response = self._call_gemini_api(prompt)
        return response if response else ""

    def generate_questions(self, content: str, num_questions: int = 1) -> List[str]:
        prompt = f"Generate {num_questions} comprehension questions based on the following content:\n\n{content}"
        response = self._call_gemini_api(prompt)
        return response.splitlines() if response else []

    def filter_content_safety(self, content: str) -> bool:
        # This is a simplified safety filter. For a real application,
        # you would use a dedicated content safety API or a more robust model.
        prompt = f"Is the following content safe for children? Answer with only 'true' or 'false'. Content: {content}"
        response = self._call_gemini_api(prompt)
        return response.lower().strip() == 'true' if response else False
