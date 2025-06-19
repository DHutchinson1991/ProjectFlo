"use client";

import React from "react";
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/AuthProvider";

interface UnauthorizedPageProps {
    message?: string;
    requiredRole?: string;
}

export function UnauthorizedPage({
    message = "You don't have permission to access this page.",
    requiredRole
}: UnauthorizedPageProps) {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleGoBack = () => {
        router.back();
    };

    const handleGoHome = () => {
        if (user) {
            router.push("/app-crm");
        } else {
            router.push("/");
        }
    };

    const handleLogin = () => {
        router.push("/login");
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    padding: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom color="error">
                    Access Denied
                </Typography>

                <Alert severity="warning" sx={{ mb: 3, width: "100%" }}>
                    {message}
                    {requiredRole && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            This page requires {requiredRole} role access.
                        </Typography>
                    )}
                </Alert>

                {user ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                        <Typography variant="body1" align="center">
                            You are logged in as: <strong>{user.email}</strong>
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                            Your role: <strong>{user.role?.name || "No role assigned"}</strong>
                        </Typography>

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
                            <Button variant="outlined" onClick={handleGoBack}>
                                Go Back
                            </Button>
                            <Button variant="contained" onClick={handleGoHome}>
                                Go to Dashboard
                            </Button>
                            <Button variant="outlined" color="secondary" onClick={handleLogout}>
                                Logout
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                        <Typography variant="body1" align="center">
                            You need to be logged in to access this page.
                        </Typography>

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
                            <Button variant="outlined" onClick={handleGoBack}>
                                Go Back
                            </Button>
                            <Button variant="contained" onClick={handleLogin}>
                                Login
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default UnauthorizedPage;
