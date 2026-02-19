import json
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
        prompt = f"""You are a gifted children's storyteller who makes news exciting and memorable.

Rewrite this news article as an engaging, story-driven piece for kids aged {age_level}. Follow these rules:

1. Start with a hook that grabs attention (a question, a "Wow!" moment, or a surprising fact)
2. Use vivid language and comparisons kids can relate to (e.g., "as tall as 10 school buses stacked up!")
3. Weave in 2-3 surprising "wow factor" facts naturally into the story
4. Keep sentences short and punchy for the age group
5. End with something that sparks curiosity or a call to action ("Next time you see a butterfly...")
6. Use a warm, enthusiastic tone — like an excited teacher sharing something amazing

Article to rewrite:
{content}

Write ONLY the rewritten story, no headers or labels."""
        response = self._call_gemini_api(prompt)
        return response if response else content

    def generate_educational_context(self, fact: str) -> str:
        prompt = f"""Generate a short, mind-blowing educational context for kids about this topic.
Include one "wow factor" fact that would make a kid say "No way!"
For example, if the topic is "shrimp", you might say: "Did you know a shrimp's heart is actually in its head? And some shrimp can snap their claws so fast, they create a bubble hotter than the surface of the sun!"

Topic: {fact}

Write 2-3 sentences max. Be enthusiastic and use kid-friendly language."""
        response = self._call_gemini_api(prompt)
        return response if response else ""

    def generate_questions(self, content: str, num_questions: int = 3) -> List[str]:
        prompt = f"""Based on this content, generate {num_questions} questions for kids. Mix these types:

1. A fun multiple-choice quiz question (format: "Quiz: [question]? A) ... B) ... C) ... D) ...")
2. A "Think About It" discussion question that encourages creative thinking
3. A "What Would You Do?" question that connects the topic to the child's own life

Content:
{content}

Return each question on its own line. No numbering or labels."""
        response = self._call_gemini_api(prompt)
        if not response:
            return []
        return [q.strip() for q in response.strip().splitlines() if q.strip()]

    def filter_content_safety(self, content: str) -> bool:
        prompt = f"Is the following content safe for children? Answer with only 'true' or 'false'. Content: {content}"
        response = self._call_gemini_api(prompt)
        return response.lower().strip() == 'true' if response else False

    def extract_fun_facts(self, content: str) -> List[str]:
        prompt = f"""You are a "fun facts machine" for kids! Based on the topic in this article, generate 3-5 surprising, entertaining facts that would make kids say "Wow!" or "No way!"

Rules:
- Facts should be RELATED to the topic but NOT just repeat what the article says
- Each fact should be surprising, weird, or amazing
- Use kid-friendly language
- Keep each fact to 1-2 sentences
- Include comparisons kids can relate to (sports fields, school buses, etc.)

Examples of great fun facts:
- "Octopuses have THREE hearts and BLUE blood!"
- "A group of flamingos is called a 'flamboyance' — how cool is that?"
- "Honey never goes bad. Scientists found 3,000-year-old honey in Egyptian tombs and it was still perfectly good to eat!"

Article:
{content}

Return each fact on its own line. No numbering or bullet points."""
        response = self._call_gemini_api(prompt)
        if not response:
            return []
        return [f.strip() for f in response.strip().splitlines() if f.strip()]

    def suggest_search_terms(self, title: str, content: str) -> Dict[str, str]:
        prompt = f"""Based on this article, suggest search terms for finding related media.

Article title: {title}
Article content (first 200 chars): {content[:200]}

Return a JSON object with exactly these two keys:
- "youtube_query": a YouTube search query for a short educational kids video about this topic (5-10 words)
- "image_query": a Pexels image search query for a beautiful photo related to this topic (2-4 words)

Return ONLY valid JSON, no other text."""
        response = self._call_gemini_api(prompt)
        if not response:
            return {"youtube_query": title, "image_query": title.split()[0]}
        try:
            # Try to parse JSON from the response, handling markdown code blocks
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            return {"youtube_query": title, "image_query": title.split()[0]}

    def categorize_content(self, title: str, content: str) -> str:
        prompt = f"""Categorize this children's news article into exactly ONE of these categories:
- ANIMALS_NATURE
- SCIENCE_DISCOVERY
- SPACE_EARTH
- TECHNOLOGY_INNOVATION
- SPORTS_HUMAN_ACHIEVEMENT
- ARTS_CULTURE
- WORLD_RECORDS_FUN_FACTS

Article title: {title}
Article excerpt: {content[:300]}

Return ONLY the category name, nothing else."""
        response = self._call_gemini_api(prompt)
        if not response:
            return "SCIENCE_DISCOVERY"
        category = response.strip().upper().replace(" ", "_")
        valid = {"ANIMALS_NATURE", "SCIENCE_DISCOVERY", "SPACE_EARTH",
                 "TECHNOLOGY_INNOVATION", "SPORTS_HUMAN_ACHIEVEMENT",
                 "ARTS_CULTURE", "WORLD_RECORDS_FUN_FACTS"}
        return category if category in valid else "SCIENCE_DISCOVERY"
