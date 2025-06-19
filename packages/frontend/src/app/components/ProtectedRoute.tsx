"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { UnauthorizedPage } from './UnauthorizedPage';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string[];
    redirectTo?: string;
    showUnauthorizedPage?: boolean;
}

export function ProtectedRoute({
    children,
    requiredRoles = [],
    redirectTo = '/login',
    showUnauthorizedPage = false
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2
                }}
            >
                <CircularProgress size={40} />
                <Typography variant="body1" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.some(role =>
            user.roles.includes(role) || user.role?.name === role
        );

        if (!hasRequiredRole) {
            if (showUnauthorizedPage) {
                return (
                    <UnauthorizedPage
                        message="You don't have the required permissions to access this page."
                        requiredRole={requiredRoles.join(', ')}
                    />
                );
            }

            router.push('/unauthorized');
            return null;
        }
    }

    return <>{children}</>;
}

// Helper component for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['Admin']}>
            {children}
        </ProtectedRoute>
    );
}

// Helper component for any authenticated user
export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}
