// packages/frontend/src/app/providers/AuthProvider.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
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

    const isAuthenticated = !!user;

    const logout = useCallback(() => {
        // Clear token from API service (which also clears localStorage)
        authService.setToken(null);
        localStorage.removeItem("userProfile");
        setToken(null);
        setUser(null);
        // Navigation is now handled by ProtectedRoute, which will see the user is gone.
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            authService.onUnauthorized(() => logout());

            // Refresh token from localStorage (important for hot reloads)
            authService.refreshToken();
            const storedToken = authService.getToken(); if (storedToken) {
                setToken(storedToken);

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
                } catch (error) {
                    console.error("Auth initialization failed, logging out:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, [logout]);

    const login = async (credentials: LoginCredentials) => {
        // Let the UI component handle loading states and errors
        const response = await authService.login(credentials);

        // Set token using API service (which also saves to localStorage)
        authService.setToken(response.access_token);

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

        // Update state. The LoginPage will see this change and redirect.
        setUser(userData);
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
