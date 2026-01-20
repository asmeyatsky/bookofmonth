/**
 * Tests for AuthContext
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { authService } from '../../src/services/AuthService';

// Mock the auth service
jest.mock('../../src/services/AuthService', () => ({
  authService: {
    initialize: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getUser: jest.fn(),
    getToken: jest.fn(),
    refreshUser: jest.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.initialize as jest.Mock).mockResolvedValue(false);
  });

  describe('initial state', () => {
    it('should start with isLoading true', async () => {
      (authService.initialize as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(false), 100))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set isLoading false after initialization', async () => {
      (authService.initialize as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('initialization with existing session', () => {
    it('should restore user and token if already authenticated', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      const mockToken = 'existing-token';

      (authService.initialize as jest.Mock).mockResolvedValue(true);
      (authService.getUser as jest.Mock).mockReturnValue(mockUser);
      (authService.getToken as jest.Mock).mockReturnValue(mockToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe(mockToken);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('login', () => {
    it('should update state on successful login', async () => {
      const mockResponse = {
        user: { id: 1, username: 'newuser', email: 'new@example.com' },
        token: 'new-token',
      };

      (authService.initialize as jest.Mock).mockResolvedValue(false);
      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ username: 'newuser', password: 'password' });
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.token).toBe(mockResponse.token);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should throw error on failed login', async () => {
      (authService.initialize as jest.Mock).mockResolvedValue(false);
      (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({ username: 'baduser', password: 'wrong' });
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should update state on successful registration', async () => {
      const mockResponse = {
        user: { id: 2, username: 'registered', email: 'reg@example.com' },
        token: 'register-token',
      };

      (authService.initialize as jest.Mock).mockResolvedValue(false);
      (authService.register as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          username: 'registered',
          email: 'reg@example.com',
          password: 'password123',
          password_confirm: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear state on logout', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

      (authService.initialize as jest.Mock).mockResolvedValue(true);
      (authService.getUser as jest.Mock).mockReturnValue(mockUser);
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('refreshUser', () => {
    it('should update user on refresh', async () => {
      const initialUser = { id: 1, username: 'user', email: 'old@example.com' };
      const updatedUser = { id: 1, username: 'user', email: 'new@example.com' };

      (authService.initialize as jest.Mock).mockResolvedValue(true);
      (authService.getUser as jest.Mock).mockReturnValue(initialUser);
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.refreshUser as jest.Mock).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.email).toBe('old@example.com');
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user?.email).toBe('new@example.com');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
