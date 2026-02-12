import { AUTH_API_URL, REQUEST_TIMEOUT_MS } from '../config';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    is_active: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
}

class AuthService {
    private token: string | null = null;
    private user: User | null = null;

    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async initialize(): Promise<boolean> {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                this.token = storedToken;
                this.user = JSON.parse(storedUser);
                return true;
            }
            return false;
        } catch (error) {
            if (__DEV__) console.error('Error initializing auth:', error);
            return false;
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await this.fetchWithTimeout(`${AUTH_API_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }

        const data: AuthResponse = await response.json();
        await this.setAuthData(data);
        return data;
    }

    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const response = await this.fetchWithTimeout(`${AUTH_API_URL}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = Object.values(errorData).flat().join(', ');
            throw new Error(errorMessage || 'Registration failed');
        }

        const data: AuthResponse = await response.json();
        await this.setAuthData(data);
        return data;
    }

    async logout(): Promise<void> {
        try {
            if (this.token) {
                await this.fetchWithTimeout(`${AUTH_API_URL}/logout/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            if (__DEV__) console.error('Error logging out from server:', error);
        } finally {
            await this.clearAuthData();
        }
    }

    async refreshUser(): Promise<User | null> {
        if (!this.token) return null;

        try {
            const response = await this.fetchWithTimeout(`${AUTH_API_URL}/users/me/`, {
                headers: { 'Authorization': `Token ${this.token}` },
            });

            if (response.ok) {
                const user: User = await response.json();
                this.user = user;
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                return user;
            }
        } catch (error) {
            if (__DEV__) console.error('Error refreshing user:', error);
        }
        return null;
    }

    private async setAuthData(data: AuthResponse): Promise<void> {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    private async clearAuthData(): Promise<void> {
        this.token = null;
        this.user = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    getToken(): string | null {
        return this.token;
    }

    getUser(): User | null {
        return this.user;
    }

    isAuthenticated(): boolean {
        return this.token !== null;
    }

    getAuthHeaders(): { Authorization: string } | {} {
        if (this.token) {
            return { 'Authorization': `Token ${this.token}` };
        }
        return {};
    }
}

export const authService = new AuthService();
