// packages/frontend/src/app/providers/AuthProvider.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { authService } from "../../lib/api";
import {
    UserProfile,
    LoginCredentials,
    AuthContextType,
    AuthProviderProps,
} from "../../lib/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const isAuthenticated = !!user;

    const logout = useCallback(() => {
        // Clear tokens from API service (which also clears localStorage)
        authService.setToken(null);
        authService.setRefreshToken(null);
        localStorage.removeItem("userProfile");
        setToken(null);
        setRefreshToken(null);
        setUser(null);

        // Clear refresh interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
        // Navigation is now handled by ProtectedRoute, which will see the user is gone.
    }, []);

    // Periodic token refresh function
    const startPeriodicRefresh = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        // Refresh token every 45 minutes (before the 60-minute expiration)
        refreshIntervalRef.current = setInterval(async () => {
            if (refreshToken) {
                try {
                    const refreshResponse = await authService.refresh(refreshToken);
                    authService.setToken(refreshResponse.access_token);
                    authService.setRefreshToken(refreshResponse.refresh_token);
                    setToken(refreshResponse.access_token);
                    setRefreshToken(refreshResponse.refresh_token);
                    console.log('Token refreshed successfully');
                } catch (error) {
                    console.error('Periodic token refresh failed:', error);
                    logout();
                }
            }
        }, 45 * 60 * 1000); // 45 minutes
    }, [refreshToken, logout]);

    useEffect(() => {
        const initializeAuth = async () => {
            authService.onUnauthorized(() => logout());

            // Refresh tokens from localStorage (important for hot reloads)
            authService.refreshToken();
            const storedToken = authService.getToken();
            const storedRefreshToken = authService.getRefreshToken();

            if (storedToken && storedRefreshToken) {
                setToken(storedToken);
                setRefreshToken(storedRefreshToken);

                try {
                    // Always fetch fresh profile data from API (don't use cached data for display)
                    const profile = await authService.getProfile();
                    const freshUser = {
                        id: profile.id,
                        email: profile.email,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        roles: profile.roles,
                        role: profile.role,
                    };

                    // Update with fresh data and cache it
                    setUser(freshUser);
                    localStorage.setItem("userProfile", JSON.stringify(freshUser));

                    // Start periodic refresh
                    startPeriodicRefresh();
                } catch (error) {
                    console.error("Auth initialization failed, logging out:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initializeAuth();

        // Cleanup interval on unmount
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [logout, startPeriodicRefresh]);

    const login = async (credentials: LoginCredentials) => {
        // Let the UI component handle loading states and errors
        const response = await authService.login(credentials);

        // Set tokens using API service (which also saves to localStorage)
        authService.setToken(response.access_token);
        authService.setRefreshToken(response.refresh_token);

        // Ensure consistent user data structure
        const userData = {
            id: response.user.id,
            email: response.user.email,
            first_name: response.user.first_name,
            last_name: response.user.last_name,
            roles: response.user.roles,
            role: response.user.role,
        };

        localStorage.setItem("userProfile", JSON.stringify(userData));
        setToken(response.access_token);
        setRefreshToken(response.refresh_token);

        // Update state. The LoginPage will see this change and redirect.
        setUser(userData);

        // Start periodic refresh
        startPeriodicRefresh();
    };

    const refreshAuth = async () => {
        try {
            const profile = await authService.getProfile();
            const userData = {
                id: profile.id,
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                roles: profile.roles,
                role: profile.role,
            };

            setUser(userData);
            localStorage.setItem("userProfile", JSON.stringify(userData));
        } catch (error) {
            console.error("Auth refresh failed:", error);
            logout();
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
        token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
