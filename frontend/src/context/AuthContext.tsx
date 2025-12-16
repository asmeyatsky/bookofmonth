import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterCredentials, AuthResponse } from '../services/AuthService';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const isAuthenticated = await authService.initialize();
            if (isAuthenticated) {
                setUser(authService.getUser());
                setToken(authService.getToken());
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await authService.login(credentials);
        setUser(response.user);
        setToken(response.token);
        return response;
    };

    const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const response = await authService.register(credentials);
        setUser(response.user);
        setToken(response.token);
        return response;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        setToken(null);
    };

    const refreshUser = async () => {
        const updatedUser = await authService.refreshUser();
        if (updatedUser) {
            setUser(updatedUser);
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: token !== null,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
