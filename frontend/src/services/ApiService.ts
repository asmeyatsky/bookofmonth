import { authService } from './AuthService';

const API_BASE_URL = 'http://localhost:8000/api';

interface RequestOptions {
    method?: string;
    body?: any;
    requiresAuth?: boolean;
}

class ApiService {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, requiresAuth = false } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (requiresAuth) {
            const token = authService.getToken();
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }
        }

        const config: RequestInit = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.detail || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // News Events (public)
    async getNewsEvents() {
        return this.request<any>('/content/news-events/');
    }

    // Monthly Books (public)
    async getMonthlyBooks() {
        return this.request<any>('/assembly/monthly-books/');
    }

    async getMonthlyBook(id: string) {
        return this.request<any>(`/assembly/monthly-books/${id}/`);
    }

    // Quizzes (public)
    async getQuizzes() {
        return this.request<any>('/quizzes/quizzes/');
    }

    async getQuiz(id: string) {
        return this.request<any>(`/quizzes/quizzes/${id}/`);
    }

    // Bookmarks (requires auth)
    async getBookmarks() {
        return this.request<any>('/users/bookmarks/', { requiresAuth: true });
    }

    async createBookmark(newsEventId: string) {
        return this.request<any>('/users/bookmarks/', {
            method: 'POST',
            body: { news_event_id: newsEventId },
            requiresAuth: true,
        });
    }

    async deleteBookmark(bookmarkId: number) {
        return this.request<any>(`/users/bookmarks/${bookmarkId}/`, {
            method: 'DELETE',
            requiresAuth: true,
        });
    }

    // Reading Progress (requires auth)
    async getReadingProgress(newsEventId?: string) {
        const endpoint = newsEventId
            ? `/users/reading-progress/?news_event_id=${newsEventId}`
            : '/users/reading-progress/';
        return this.request<any>(endpoint, { requiresAuth: true });
    }

    async updateReadingProgress(newsEventId: string, completed: boolean) {
        return this.request<any>('/users/reading-progress/', {
            method: 'POST',
            body: { news_event_id: newsEventId, completed },
            requiresAuth: true,
        });
    }

    async patchReadingProgress(progressId: number, completed: boolean) {
        return this.request<any>(`/users/reading-progress/${progressId}/`, {
            method: 'PATCH',
            body: { completed },
            requiresAuth: true,
        });
    }

    // Child Profiles (requires auth)
    async getChildProfiles() {
        return this.request<any>('/users/child-profiles/', { requiresAuth: true });
    }

    async createChildProfile(data: { name: string; age: number; reading_level: string }) {
        return this.request<any>('/users/child-profiles/', {
            method: 'POST',
            body: data,
            requiresAuth: true,
        });
    }

    async updateChildProfile(id: number, data: { name?: string; age?: number; reading_level?: string }) {
        return this.request<any>(`/users/child-profiles/${id}/`, {
            method: 'PATCH',
            body: data,
            requiresAuth: true,
        });
    }

    async deleteChildProfile(id: number) {
        return this.request<any>(`/users/child-profiles/${id}/`, {
            method: 'DELETE',
            requiresAuth: true,
        });
    }

    // Reading Streaks (requires auth)
    async getReadingStreaks() {
        return this.request<any>('/users/reading-streaks/', { requiresAuth: true });
    }

    // Achievements (requires auth)
    async getAchievements() {
        return this.request<any>('/users/achievements/', { requiresAuth: true });
    }

    async getUserAchievements() {
        return this.request<any>('/users/user-achievements/', { requiresAuth: true });
    }

    // Search (public)
    async searchNewsEvents(query: string) {
        return this.request<any>(`/content/news-events/?search=${encodeURIComponent(query)}`);
    }

    // Quiz Submissions (requires auth)
    async submitQuiz(quizId: string, answers: { question: string; selected_answer: string }[]) {
        return this.request<any>('/quizzes/submissions/', {
            method: 'POST',
            body: { quiz: quizId, answers },
            requiresAuth: true,
        });
    }

    async getQuizSubmission(quizId: string) {
        return this.request<any>(`/quizzes/submissions/by_quiz/?quiz_id=${quizId}`, {
            requiresAuth: true,
        });
    }
}

export const apiService = new ApiService();
