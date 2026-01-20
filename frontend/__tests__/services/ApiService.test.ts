/**
 * Tests for ApiService
 */
import { apiService } from '../../src/services/ApiService';
import { authService } from '../../src/services/AuthService';

// Mock fetch globally
global.fetch = jest.fn();

// Mock authService
jest.mock('../../src/services/AuthService', () => ({
  authService: {
    getToken: jest.fn(),
  },
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('getNewsEvents', () => {
    it('should fetch news events without authentication', async () => {
      const mockResponse = {
        results: [
          { id: '1', title: 'News 1' },
          { id: '2', title: 'News 2' },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.getNewsEvents();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/content/news-events/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(apiService.getNewsEvents()).rejects.toThrow('Server error');
    });
  });

  describe('getMonthlyBooks', () => {
    it('should fetch monthly books', async () => {
      const mockResponse = {
        results: [{ id: '1', title: 'January 2024' }],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.getMonthlyBooks();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/assembly/monthly-books/',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMonthlyBook', () => {
    it('should fetch a specific monthly book by id', async () => {
      const mockBook = { id: '123', title: 'Test Book' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBook),
      });

      const result = await apiService.getMonthlyBook('123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/assembly/monthly-books/123/',
        expect.any(Object)
      );
      expect(result).toEqual(mockBook);
    });
  });

  describe('authenticated requests', () => {
    it('should include auth token for getBookmarks', async () => {
      const mockToken = 'test-token-123';
      (authService.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await apiService.getBookmarks();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/bookmarks/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Token ${mockToken}`,
          }),
        })
      );
    });

    it('should create bookmark with POST request', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await apiService.createBookmark('news-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/bookmarks/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ news_event_id: 'news-123' }),
        })
      );
    });

    it('should delete bookmark with DELETE request', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      await apiService.deleteBookmark(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/bookmarks/1/',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('child profiles', () => {
    it('should get child profiles', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');

      const mockProfiles = [{ id: 1, name: 'Child 1', age: 8 }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfiles),
      });

      const result = await apiService.getChildProfiles();

      expect(result).toEqual(mockProfiles);
    });

    it('should create child profile', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');

      const newProfile = { name: 'Test Child', age: 7, reading_level: 'AGE_7_9' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, ...newProfile }),
      });

      const result = await apiService.createChildProfile(newProfile);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newProfile),
        })
      );
      expect(result.name).toBe('Test Child');
    });

    it('should update child profile', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, age: 9 }),
      });

      await apiService.updateChildProfile(1, { age: 9 });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/users/child-profiles/1/',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('search', () => {
    it('should search news events with encoded query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await apiService.searchNewsEvents('science & technology');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/content/news-events/?search=science%20%26%20technology',
        expect.any(Object)
      );
    });
  });

  describe('quiz submissions', () => {
    it('should submit quiz answers', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');

      const answers = [
        { question: 'q1', selected_answer: 'A' },
        { question: 'q2', selected_answer: 'B' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ score: 2, total: 2 }),
      });

      const result = await apiService.submitQuiz('quiz-123', answers);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/quizzes/submissions/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ quiz: 'quiz-123', answers }),
        })
      );
      expect(result.score).toBe(2);
    });
  });
});
