"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { authService } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if there's a stored token
        const token = authService.getToken();

        if (!token) {
          // No token, redirect to login
          router.push("/login");
          return;
        }

        // Verify token is still valid by getting user profile
        const userProfile = await authService.getProfile();

        // Redirect based on user role
        if (
          userProfile.roles.includes("Admin") ||
          userProfile.roles.includes("Lead Videographer")
        ) {
          router.push("/dashboard"); // Studio dashboard (route group doesn't create URL segment)
        } else if (
          userProfile.roles.includes("Client Manager") ||
          userProfile.roles.includes("Client")
        ) {
          router.push("/portal"); // Portal for client management
        } else {
          router.push("/dashboard"); // Default dashboard
        }
      } catch (error) {
        // Token invalid or other error, redirect to login
        console.log("Authentication failed:", error);
        authService.setToken(null);
        localStorage.removeItem("userProfile");
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          ProjectFlo Wedding Videos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // This should never be reached since we redirect, but just in case
  return null;
}
