"""
Load testing configuration using Locust.

Run with: locust -f loadtests/locustfile.py --host=http://localhost:8000
"""
from locust import HttpUser, task, between, events
import json
import random


class BookOfMonthUser(HttpUser):
    """Simulates a typical user of the Book of the Month application."""

    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks

    def on_start(self):
        """Called when a user starts. Login to get authentication token."""
        # For load testing, create test users in advance or use registration
        self.token = None
        self.user_id = None

        # Try to login with test credentials
        response = self.client.post(
            "/api/users/login/",
            json={
                "username": f"loadtest_user_{random.randint(1, 100)}",
                "password": "LoadTest123!"
            },
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.user_id = data.get("user", {}).get("id")

    def get_auth_headers(self):
        """Return authentication headers if logged in."""
        if self.token:
            return {
                "Authorization": f"Token {self.token}",
                "Content-Type": "application/json"
            }
        return {"Content-Type": "application/json"}

    # Public endpoints (no auth required)
    @task(10)
    def get_news_events(self):
        """Browse news events - most common action."""
        self.client.get("/api/content/news-events/")

    @task(5)
    def get_news_event_detail(self):
        """View a specific news event."""
        # First get list to get a valid ID
        response = self.client.get("/api/content/news-events/")
        if response.status_code == 200:
            data = response.json()
            if data.get("results"):
                event_id = random.choice(data["results"])["id"]
                self.client.get(f"/api/content/news-events/{event_id}/")

    @task(3)
    def get_monthly_books(self):
        """Browse monthly books."""
        self.client.get("/api/assembly/monthly-books/")

    @task(2)
    def search_news(self):
        """Search for news events."""
        search_terms = ["science", "animals", "space", "technology", "sports"]
        term = random.choice(search_terms)
        self.client.get(f"/api/content/news-events/?search={term}")

    @task(2)
    def filter_by_category(self):
        """Filter news by category."""
        categories = ["Science", "Technology", "Animals", "Space", "Sports"]
        category = random.choice(categories)
        self.client.get(f"/api/content/news-events/?categories={category}")

    @task(1)
    def get_quizzes(self):
        """View available quizzes."""
        self.client.get("/api/quizzes/quizzes/")

    # Authenticated endpoints
    @task(3)
    def get_bookmarks(self):
        """View user bookmarks (requires auth)."""
        if self.token:
            self.client.get(
                "/api/users/bookmarks/",
                headers=self.get_auth_headers()
            )

    @task(2)
    def get_reading_progress(self):
        """View reading progress (requires auth)."""
        if self.token:
            self.client.get(
                "/api/users/reading-progress/",
                headers=self.get_auth_headers()
            )

    @task(2)
    def get_child_profiles(self):
        """View child profiles (requires auth)."""
        if self.token:
            self.client.get(
                "/api/users/child-profiles/",
                headers=self.get_auth_headers()
            )

    @task(1)
    def get_achievements(self):
        """View achievements (requires auth)."""
        if self.token:
            self.client.get(
                "/api/users/achievements/",
                headers=self.get_auth_headers()
            )

    @task(1)
    def get_reading_streaks(self):
        """View reading streaks (requires auth)."""
        if self.token:
            self.client.get(
                "/api/users/reading-streaks/",
                headers=self.get_auth_headers()
            )

    @task(1)
    def health_check(self):
        """Check application health."""
        self.client.get("/api/health/")


class AdminUser(HttpUser):
    """Simulates an admin user for admin operations."""

    wait_time = between(5, 15)
    weight = 1  # Much fewer admin users

    def on_start(self):
        """Login as admin."""
        response = self.client.post(
            "/api/users/login/",
            json={
                "username": "admin",
                "password": "AdminPassword123!"
            },
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
        else:
            self.token = None

    @task
    def list_users(self):
        """List all users (admin only)."""
        if self.token:
            self.client.get(
                "/api/users/users/",
                headers={
                    "Authorization": f"Token {self.token}",
                    "Content-Type": "application/json"
                }
            )


# Event hooks for custom reporting
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, **kwargs):
    """Log slow requests for analysis."""
    if response_time > 1000:  # Log requests taking more than 1 second
        print(f"SLOW REQUEST: {request_type} {name} - {response_time}ms")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts."""
    print("Load test starting...")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops."""
    print("Load test completed.")
