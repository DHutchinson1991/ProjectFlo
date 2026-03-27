"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { UnauthorizedPage } from "../UnauthorizedPage/UnauthorizedPage";
import { Loading } from "@/shared/ui";
import { LoginModal } from "@/features/platform/auth/components/LoginModal";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
    requiredRoles?: string[];
    redirectTo?: string;
    showUnauthorizedPage?: boolean;
    fallback?: React.ReactNode;
}

export function ProtectedRoute({
    children,
    requiredRole,
    requiredRoles = [],
    redirectTo = "/login",
    showUnauthorizedPage = false,
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const mergedRoles = requiredRole ? [...requiredRoles, requiredRole] : requiredRoles;

    // Only hard-redirect to /login if we're on the login page itself
    // (e.g. direct navigation). For all other pages, show the modal overlay.
    useEffect(() => {
        if (!isLoading && !isAuthenticated && redirectTo === "/login") {
            // Let the modal handle it — no redirect needed
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return <Loading message="Checking authentication..." />;
    }

    // Not authenticated → render the page (blurred behind) + the login modal on top
    if (!isAuthenticated) {
        return (
            <>
                {/* Page content stays mounted so it's visible through the modal blur */}
                <div style={{ pointerEvents: "none", userSelect: "none", filter: "blur(2px)", opacity: 0.5 }}>
                    {children}
                </div>
                <LoginModal />
            </>
        );
    }

    // Check role requirements
    if (mergedRoles.length > 0 && user) {
        const hasRequiredRole = mergedRoles.some(
            (role) => user.roles.includes(role) || user.role?.name === role,
        );

        if (!hasRequiredRole) {
            if (showUnauthorizedPage) {
                return (
                    <UnauthorizedPage
                        message="You don't have the required permissions to access this page."
                        requiredRole={mergedRoles.join(", ")}
                    />
                );
            }

            router.push("/unauthorized");
            return null;
        }
    }

    return <>{children}</>;
}
