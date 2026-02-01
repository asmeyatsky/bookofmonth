import { authService } from './AuthService';

const API_BASE_URL = 'http://127.0.0.1:8002/api';

interface RequestOptions {
    method?: string;
    body?: any;
    requiresAuth?: boolean;
}

interface NewsEventFilters {
    readingLevel?: string;
    category?: string;
    search?: string;
}

interface MonthlyBookFilters {
    readingLevel?: string;
    month?: number;
    year?: number;
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

    // Build query string from filters
    private buildQueryString(params: Record<string, string | number | undefined>): string {
        const queryParts: string[] = [];
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    }

    // News Events (public)
    async getNewsEvents(filters?: NewsEventFilters) {
        const queryParams: Record<string, string | undefined> = {};
        if (filters?.readingLevel) {
            queryParams['age_appropriateness'] = filters.readingLevel;
        }
        if (filters?.category) {
            queryParams['category'] = filters.category;
        }
        if (filters?.search) {
            queryParams['search'] = filters.search;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/content/news-events/${queryString}`);
    }

    // Get single news event
    async getNewsEvent(id: string) {
        return this.request<any>(`/content/news-events/${id}/`);
    }

    // Monthly Books (public)
    async getMonthlyBooks(filters?: MonthlyBookFilters) {
        const queryParams: Record<string, string | number | undefined> = {};
        if (filters?.readingLevel) {
            queryParams['reading_level'] = filters.readingLevel;
        }
        if (filters?.month) {
            queryParams['month'] = filters.month;
        }
        if (filters?.year) {
            queryParams['year'] = filters.year;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/assembly/monthly-books/${queryString}`);
    }

    async getMonthlyBook(id: string) {
        return this.request<any>(`/assembly/monthly-books/${id}/`);
    }

    // Get monthly book with full daily entries
    async getMonthlyBookWithEntries(id: string) {
        return this.request<any>(`/assembly/monthly-books/${id}/?include_entries=true`);
    }

    // Quizzes (public)
    async getQuizzes() {
        return this.request<any>('/quizzes/quizzes/');
    }

    async getQuiz(id: string) {
        return this.request<any>(`/quizzes/quizzes/${id}/`);
    }

    // Get quiz for a specific monthly book
    async getQuizForBook(bookId: string) {
        return this.request<any>(`/quizzes/quizzes/?monthly_book=${bookId}`);
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
    async getReadingProgress(newsEventId?: string, childProfileId?: number) {
        const queryParams: Record<string, string | number | undefined> = {};
        if (newsEventId) {
            queryParams['news_event_id'] = newsEventId;
        }
        if (childProfileId) {
            queryParams['child_profile'] = childProfileId;
        }
        const queryString = this.buildQueryString(queryParams);
        const endpoint = `/users/reading-progress/${queryString}`;
        return this.request<any>(endpoint, { requiresAuth: true });
    }

    async updateReadingProgress(newsEventId: string, completed: boolean, childProfileId?: number) {
        const body: Record<string, any> = { news_event_id: newsEventId, completed };
        if (childProfileId) {
            body.child_profile = childProfileId;
        }
        return this.request<any>('/users/reading-progress/', {
            method: 'POST',
            body,
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
    async getReadingStreaks(childProfileId?: number) {
        const queryParams: Record<string, number | undefined> = {};
        if (childProfileId) {
            queryParams['child_profile'] = childProfileId;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/users/reading-streaks/${queryString}`, { requiresAuth: true });
    }

    // Achievements (requires auth)
    async getAchievements() {
        return this.request<any>('/users/achievements/', { requiresAuth: true });
    }

    async getUserAchievements(childProfileId?: number) {
        const queryParams: Record<string, number | undefined> = {};
        if (childProfileId) {
            queryParams['child_profile'] = childProfileId;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/users/user-achievements/${queryString}`, { requiresAuth: true });
    }

    // Search (public)
    async searchNewsEvents(query: string, readingLevel?: string) {
        return this.getNewsEvents({ search: query, readingLevel });
    }

    // Search monthly books
    async searchMonthlyBooks(query: string, readingLevel?: string) {
        const queryParams: Record<string, string | undefined> = {
            search: query,
        };
        if (readingLevel) {
            queryParams['reading_level'] = readingLevel;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/assembly/monthly-books/${queryString}`);
    }

    // Quiz Submissions (requires auth)
    async submitQuiz(quizId: string, answers: { question: string; selected_answer: string }[], childProfileId?: number) {
        const body: Record<string, any> = { quiz: quizId, answers };
        if (childProfileId) {
            body.child_profile = childProfileId;
        }
        return this.request<any>('/quizzes/submissions/', {
            method: 'POST',
            body,
            requiresAuth: true,
        });
    }

    async getQuizSubmission(quizId: string, childProfileId?: number) {
        const queryParams: Record<string, string | number | undefined> = {
            quiz_id: quizId,
        };
        if (childProfileId) {
            queryParams['child_profile'] = childProfileId;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/quizzes/submissions/by_quiz/${queryString}`, {
            requiresAuth: true,
        });
    }

    // Parent Dashboard Analytics
    async getReadingAnalytics(childProfileId?: number) {
        const queryParams: Record<string, number | undefined> = {};
        if (childProfileId) {
            queryParams['child_profile'] = childProfileId;
        }
        const queryString = this.buildQueryString(queryParams);
        return this.request<any>(`/users/analytics/${queryString}`, { requiresAuth: true });
    }

    // Get all categories
    async getCategories() {
        return this.request<any>('/content/categories/');
    }
}

export const apiService = new ApiService();
