import os
import requests
from typing import Optional


class PexelsAdapter:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("PEXELS_API_KEY")
        self.api_url = "https://api.pexels.com/v1/search"

    def search_photo(self, query: str) -> Optional[str]:
        """Search Pexels for a photo and return the URL of the best result."""
        if not self.api_key:
            print("Pexels API key not configured, skipping image search")
            return None

        headers = {"Authorization": self.api_key}
        params = {
            "query": query,
            "per_page": 1,
            "orientation": "landscape",
            "size": "medium",
        }

        try:
            response = requests.get(self.api_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("photos"):
                # Use the "large" size — good quality without being huge
                return data["photos"][0]["src"]["large"]
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error searching Pexels: {e}")
            return None
