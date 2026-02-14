/**
 * Tests for AuthService
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// We need to import after mocking
const { authService } = require('../../src/services/AuthService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initialize', () => {
    it('should return false when no stored token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authService.initialize();

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@auth_token');
    });

    it('should return true when token exists and user data is stored', async () => {
      const mockToken = 'stored-token';
      const mockUser = { id: 1, username: 'storeduser' };

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(mockToken)  // auth_token
        .mockResolvedValueOnce(JSON.stringify(mockUser));  // user_data

      const result = await authService.initialize();

      expect(result).toBe(true);
      expect(authService.getToken()).toBe(mockToken);
      expect(authService.getUser()).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should login successfully and store credentials', async () => {
      const mockResponse = {
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        token: 'new-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/login/',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
          signal: expect.any(Object), // Signal is an AbortSignal object
        })
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@auth_token', 'new-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@auth_user',
        JSON.stringify(mockResponse.user)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on login failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      await expect(
        authService.login({ username: 'bad', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle account lockout response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'Account locked',
          locked_until_seconds: 900,
        }),
      });

      await expect(
        authService.login({ username: 'locked', password: 'pass' })
      ).rejects.toThrow('Account locked');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        user: { id: 2, username: 'newuser', email: 'new@example.com' },
        token: 'register-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        password_confirm: 'password123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/register/',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
            password_confirm: 'password123',
          }),
          signal: expect.any(Object), // Signal is an AbortSignal object
        })
      );

      expect(result.user.username).toBe('newuser');
    });

    it('should throw error on registration failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Username already exists' }),
      });

      await expect(
        authService.register({
          username: 'existing',
          email: 'test@example.com',
          password: 'pass',
          password_confirm: 'pass',
        })
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('logout', () => {
    it('should clear stored credentials', async () => {
      // First, set up a logged-in state
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Logged out' }),
      });

      await authService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_user');
    });

    it('should still clear local storage even if API call fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@auth_user');
    });
  });

  describe('getToken and getUser', () => {
    it('should return null when not logged in', () => {
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });
  });
});
