"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "../providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if the user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the AuthProvider's login function
      await login({ email, password });

      // The redirect will be handled by the useEffect above
      // when isAuthenticated changes
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#121212", // Force dark background
        color: "#ffffff", // Force white text
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: "#1e1e1e", // Force dark paper background
            borderRadius: 2,
            boxShadow: 3,
            border: "1px solid #333",
          }}
        >
          <Typography component="h1" variant="h5" sx={{ color: "#ffffff" }}>
            Sign In
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiInputLabel-root': { color: '#aaaaaa' },
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#444444' },
                  '&:hover fieldset': { borderColor: '#666666' },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiInputLabel-root': { color: '#aaaaaa' },
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#444444' },
                  '&:hover fieldset': { borderColor: '#666666' },
                },
              }}
            />
            {/* TODO: Add Remember me checkbox if needed */}
            {/* TODO: Add Forgot password link if needed */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
            {/* TODO: Add Sign up link if needed */}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
