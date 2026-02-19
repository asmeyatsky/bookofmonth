import os
import requests
from typing import Optional


class YouTubeAdapter:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("YOUTUBE_API_KEY")
        self.api_url = "https://www.googleapis.com/youtube/v3/search"

    def search_video(self, query: str) -> Optional[str]:
        """Search YouTube for an educational kids video and return the watch URL."""
        if not self.api_key:
            print("YouTube API key not configured, skipping video search")
            return None

        params = {
            "part": "snippet",
            "q": f"{query} for kids educational",
            "type": "video",
            "maxResults": 1,
            "videoDuration": "short",  # Under 4 minutes
            "safeSearch": "strict",
            "key": self.api_key,
        }

        try:
            response = requests.get(self.api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            items = data.get("items", [])
            if items:
                video_id = items[0]["id"]["videoId"]
                return f"https://www.youtube.com/watch?v={video_id}"
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error searching YouTube: {e}")
            return None
