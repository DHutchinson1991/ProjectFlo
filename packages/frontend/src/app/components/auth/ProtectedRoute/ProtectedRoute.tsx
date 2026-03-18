"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { UnauthorizedPage } from "../UnauthorizedPage/UnauthorizedPage";
import { Loading } from "../../ui/Loading/Loading";
import { LoginModal } from "@/components/auth/LoginModal";
import { ProtectedRouteProps } from "@/lib/types";

export function ProtectedRoute({
    children,
    requiredRoles = [],
    redirectTo = "/login",
    showUnauthorizedPage = false,
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

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
    if (requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.some(
            (role) => user.roles.includes(role) || user.role?.name === role,
        );

        if (!hasRequiredRole) {
            if (showUnauthorizedPage) {
                return (
                    <UnauthorizedPage
                        message="You don't have the required permissions to access this page."
                        requiredRole={requiredRoles.join(", ")}
                    />
                );
            }

            router.push("/unauthorized");
            return null;
        }
    }

    return <>{children}</>;
}

