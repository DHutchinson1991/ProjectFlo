// packages/frontend/src/features/platform/auth/components/AuthProvider/AuthProvider.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { keyframes } from "@mui/material/styles";
import { authApi } from '@/features/platform/auth/api';
import {
    clearAuthTokens,
    getAuthToken,
    getRefreshToken,
    refreshAuthStateFromStorage,
    setAuthToken,
    setRefreshToken as storeRefreshToken,
    setUnauthorizedCallback,
} from "@/shared/api/client";
import {
    UserProfile,
    LoginCredentials,
    AuthContextType,
    AuthProviderProps,
} from "@/features/platform/auth/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Fade-in animation
const fadeIn = keyframes`
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
`;

// Pulse animation for the icon
const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
`;

function SessionExpiredOverlay() {
    const [dots, setDots] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(18, 18, 18, 0.97)",
                backdropFilter: "blur(8px)",
                animation: `${fadeIn} 0.3s ease-out`,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    p: 5,
                    borderRadius: 3,
                    bgcolor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    maxWidth: 400,
                    textAlign: "center",
                }}
            >
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: "rgba(144, 202, 249, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: `${pulse} 2s ease-in-out infinite`,
                    }}
                >
                    <LockOutlinedIcon sx={{ fontSize: 32, color: "#90caf9" }} />
                </Box>

                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            color: "#ffffff",
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        Session Expired
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "rgba(255, 255, 255, 0.6)",
                            lineHeight: 1.6,
                        }}
                    >
                        Your session has ended for security.
                        <br />
                        Redirecting you to sign in{dots}
                    </Typography>
                </Box>

                <CircularProgress
                    size={20}
                    thickness={5}
                    sx={{ color: "#90caf9", mt: 1 }}
                />
            </Box>
        </Box>
    );
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [sessionExpired, setSessionExpired] = useState(false);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    const isAuthenticated = !!user;

    const logout = useCallback(() => {
        clearAuthTokens();
        localStorage.removeItem("userProfile");
        localStorage.removeItem("projectflo_session_only_flag");
        try { sessionStorage.removeItem("projectflo_session_only"); } catch {}
        setToken(null);
        setRefreshToken(null);
        setUser(null);

        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    // Graceful session expiry: show overlay then redirect
    const handleSessionExpired = useCallback(() => {
        // Don't show overlay if already on login page
        if (window.location.pathname === "/login") {
            logout();
            return;
        }

        setSessionExpired(true);
        logout();

        // Redirect after a brief delay so user sees the message
        const currentPath = window.location.pathname + window.location.search;
        const returnTo = currentPath && currentPath !== "/" ? `?returnTo=${encodeURIComponent(currentPath)}` : "";
        setTimeout(() => {
            router.push(`/login${returnTo}`);
            // Clear the overlay after navigation
            setTimeout(() => setSessionExpired(false), 500);
        }, 2000);
    }, [logout, router]);

    // Periodic token refresh function
    const startPeriodicRefresh = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        refreshIntervalRef.current = setInterval(async () => {
            if (refreshToken) {
                try {
                    const refreshResponse = await authApi.refresh(refreshToken);
                    setAuthToken(refreshResponse.access_token);
                    storeRefreshToken(refreshResponse.refresh_token);
                    setToken(refreshResponse.access_token);
                    setRefreshToken(refreshResponse.refresh_token);
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    handleSessionExpired();
                }
            }
        }, 45 * 60 * 1000);
    }, [refreshToken, handleSessionExpired]);

    useEffect(() => {
        const initializeAuth = async () => {
            setUnauthorizedCallback(() => handleSessionExpired());

            // If session-only login and this is a new browser session,
            // the sessionStorage flag will be gone — clear tokens
            const isSessionOnly = localStorage.getItem("projectflo_session_only_flag");
            if (isSessionOnly && !sessionStorage.getItem("projectflo_session_only")) {
                clearAuthTokens();
                localStorage.removeItem("userProfile");
                localStorage.removeItem("projectflo_session_only_flag");
                setIsLoading(false);
                return;
            }

            refreshAuthStateFromStorage();
            const storedToken = getAuthToken();
            const storedRefreshToken = getRefreshToken();

            if (storedToken && storedRefreshToken) {
                setToken(storedToken);
                setRefreshToken(storedRefreshToken);

                try {
                    const profile = await authApi.getProfile();
                    const freshUser = {
                        id: profile.id,
                        email: profile.email,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        roles: profile.roles,
                        role: profile.role,
                    };

                    setUser(freshUser);
                    localStorage.setItem("userProfile", JSON.stringify(freshUser));
                    startPeriodicRefresh();
                } catch (error) {
                    console.error("Auth initialization failed:", error);
                    // Don't show expired overlay on initial load — just clear and redirect
                    logout();
                }
            }
            setIsLoading(false);
        };

        initializeAuth();

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [logout, startPeriodicRefresh, handleSessionExpired]);

    const login = async (credentials: LoginCredentials) => {
        const response = await authApi.login(credentials);

        setAuthToken(response.access_token);
        storeRefreshToken(response.refresh_token);

        if (!credentials.rememberMe) {
            sessionStorage.setItem("projectflo_session_only", "true");
            localStorage.setItem("projectflo_session_only_flag", "true");
        } else {
            sessionStorage.removeItem("projectflo_session_only");
            localStorage.removeItem("projectflo_session_only_flag");
        }

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
        setUser(userData);
        setSessionExpired(false);
        startPeriodicRefresh();
    };

    const refreshAuth = async () => {
        try {
            const profile = await authApi.getProfile();
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
            handleSessionExpired();
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

    return (
        <AuthContext.Provider value={value}>
            {sessionExpired && <SessionExpiredOverlay />}
            {children}
        </AuthContext.Provider>
    );
}
