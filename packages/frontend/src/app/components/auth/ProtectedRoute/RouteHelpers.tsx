import React from "react";
import { ProtectedRoute } from "./ProtectedRoute";

// Helper component for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRoles={["Admin"]}>{children}</ProtectedRoute>;
}

// Helper component for any authenticated user
export function AuthenticatedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
