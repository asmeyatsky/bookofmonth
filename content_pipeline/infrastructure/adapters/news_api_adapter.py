import os
import requests
from typing import List
from datetime import datetime

from content_pipeline.domain.ports.external_service_ports import NewsAggregatorPort, RawNewsArticle

class NewsAPIAdapter(NewsAggregatorPort):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("NEWS_API_KEY")
        if not self.api_key:
            raise ValueError("News API key not provided or set in environment.")
        self.api_url = "https://newsapi.org/v2/everything"

    def fetch_recent_news(self, query: str, since: datetime, language: str = "en") -> List[RawNewsArticle]:
        params = {
            "q": query,
            "from": since.isoformat(),
            "language": language,
            "apiKey": self.api_key,
            "sortBy": "publishedAt",
        }

        try:
            response = requests.get(self.api_url, params=params)
            response.raise_for_status()
            articles = response.json().get("articles", [])

            return [
                RawNewsArticle(
                    title=article["title"],
                    content=article["content"],
                    url=article["url"],
                    published_at=datetime.fromisoformat(article["publishedAt"].replace("Z", "+00:00")),
                    source_name=article["source"]["name"]
                )
                for article in articles if article["content"]
            ]
        except requests.exceptions.RequestException as e:
            print(f"Error calling News API: {e}")
            return []