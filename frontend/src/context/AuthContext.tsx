import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User, LoginCredentials, RegisterCredentials, AuthResponse } from '../services/AuthService';
import { apiService } from '../services/ApiService';

const ACTIVE_PROFILE_KEY = '@active_child_profile';

export interface ChildProfile {
    id: number;
    name: string;
    age: number;
    reading_level: string;
    user: number;
    created_at?: string;
    updated_at?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    // Child profile management
    childProfiles: ChildProfile[];
    activeChildProfile: ChildProfile | null;
    setActiveChildProfile: (profile: ChildProfile | null) => Promise<void>;
    refreshChildProfiles: () => Promise<void>;
    // Auth methods
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
    const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
    const [activeChildProfile, setActiveChildProfileState] = useState<ChildProfile | null>(null);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const isAuthenticated = await authService.initialize();
            if (isAuthenticated) {
                setUser(authService.getUser());
                setToken(authService.getToken());
                // Load child profiles and active profile after auth
                await loadChildProfiles();
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadChildProfiles = async () => {
        try {
            const profilesData = await apiService.getChildProfiles();
            const profiles = profilesData.results || profilesData || [];
            setChildProfiles(profiles);

            // Load stored active profile ID
            const storedProfileId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
            if (storedProfileId && profiles.length > 0) {
                const storedProfile = profiles.find(
                    (p: ChildProfile) => p.id === parseInt(storedProfileId, 10)
                );
                if (storedProfile) {
                    setActiveChildProfileState(storedProfile);
                } else if (profiles.length > 0) {
                    // Stored profile no longer exists, use first profile
                    setActiveChildProfileState(profiles[0]);
                    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profiles[0].id.toString());
                }
            } else if (profiles.length > 0) {
                // No stored profile, use first profile
                setActiveChildProfileState(profiles[0]);
                await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profiles[0].id.toString());
            }
        } catch (error) {
            console.error('Error loading child profiles:', error);
        }
    };

    const setActiveChildProfile = async (profile: ChildProfile | null) => {
        setActiveChildProfileState(profile);
        if (profile) {
            await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id.toString());
        } else {
            await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
        }
    };

    const refreshChildProfiles = async () => {
        await loadChildProfiles();
    };

    const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await authService.login(credentials);
        setUser(response.user);
        setToken(response.token);
        // Load child profiles after successful login
        await loadChildProfiles();
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
        setChildProfiles([]);
        setActiveChildProfileState(null);
        await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
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
        childProfiles,
        activeChildProfile,
        setActiveChildProfile,
        refreshChildProfiles,
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
