"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { UnauthorizedPage } from "../UnauthorizedPage/UnauthorizedPage";
import { Loading } from "../../ui/Loading/Loading";
import { ProtectedRouteProps } from "@/lib/types";

export function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = "/login",
  showUnauthorizedPage = false,
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
    return <Loading message="Checking authentication..." />;
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
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
