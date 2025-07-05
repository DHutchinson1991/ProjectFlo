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
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    authService.setToken(null);
    setToken(null);
    setUser(null);
    // Navigation is now handled by ProtectedRoute, which will see the user is gone.
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      authService.onUnauthorized(() => logout());
      const storedToken = localStorage.getItem("authToken");

      if (storedToken) {
        authService.setToken(storedToken);
        setToken(storedToken);
        try {
          const profile = await authService.getProfile();
          setUser({
            id: profile.id,
            email: profile.email,
            roles: profile.roles,
          });
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

    localStorage.setItem("authToken", response.access_token);
    localStorage.setItem("userProfile", JSON.stringify(response.user));
    authService.setToken(response.access_token);
    setToken(response.access_token);

    // Update state. The LoginPage will see this change and redirect.
    setUser(response.user);
  };

  const refreshAuth = async () => {
    try {
      const profile = await authService.getProfile();
      setUser({
        id: profile.id,
        email: profile.email,
        roles: profile.roles,
      });
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
