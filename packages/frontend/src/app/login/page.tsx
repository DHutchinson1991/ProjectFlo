"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { useAuth } from "../providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      await login({ email, password });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setIsLoading(false);
    }
  };

  const inputSx = {
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.5)",
      "&.Mui-focused": { color: "#90caf9" },
    },
    "& .MuiOutlinedInput-root": {
      color: "#ffffff",
      borderRadius: "12px",
      backgroundColor: "rgba(255,255,255,0.04)",
      transition: "all 0.2s ease",
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.1)",
        transition: "border-color 0.2s ease",
      },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
      "&.Mui-focused fieldset": { borderColor: "#2196F3" },
      "&.Mui-focused": {
        backgroundColor: "rgba(255,255,255,0.04)",
      },
      "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
        WebkitBoxShadow: "0 0 0 100px #1e1e1e inset !important",
        WebkitTextFillColor: "#ffffff !important",
        caretColor: "#ffffff",
        borderRadius: "12px",
      },
    },
    "& .MuiInputAdornment-root .MuiSvgIcon-root": {
      color: "rgba(255,255,255,0.3)",
      fontSize: "1.2rem",
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: "15vh",
        bgcolor: "#121212",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        // Subtle radial glow behind the card
        "&::before": {
          content: '""',
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(33,150,243,0.08) 0%, rgba(33,203,243,0.04) 40%, transparent 70%)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          mx: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo / Brand */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: "2rem",
              letterSpacing: "-0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Box
              component="span"
              sx={{
                background:
                  "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
              }}
            >
              ProjectFlo
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.875rem",
              mt: 1,
              letterSpacing: "0.04em",
            }}
          >
            Creative production, simplified
          </Typography>
        </Box>

        {/* Card */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: "16px",
            bgcolor: "rgba(30, 30, 30, 0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "1.25rem",
              mb: 0.5,
              color: "#ffffff",
            }}
          >
            Welcome back
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.85rem",
              mb: 3,
            }}
          >
            Sign in to your account to continue
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: "10px",
                  bgcolor: "rgba(211,47,47,0.12)",
                  color: "#f48fb1",
                  border: "1px solid rgba(211,47,47,0.25)",
                  "& .MuiAlert-icon": { color: "#f48fb1" },
                }}
              >
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 3.5,
                mb: 1,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "0.95rem",
                fontWeight: 600,
                letterSpacing: "0.01em",
                background:
                  "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",
                boxShadow: "0 4px 16px rgba(33,150,243,0.3)",
                transition: "all 0.2s ease",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #1e88e5 0%, #1ec3eb 100%)",
                  boxShadow: "0 6px 24px rgba(33,150,243,0.4)",
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
                "&.Mui-disabled": {
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.3)",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={22} sx={{ color: "#ffffff" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>
        </Box>

        {/* Footer hint */}
        <Typography
          sx={{
            textAlign: "center",
            mt: 3,
            color: "rgba(255,255,255,0.25)",
            fontSize: "0.75rem",
          }}
        >
          ProjectFlo &mdash; Creative Production Platform
        </Typography>
      </Box>
    </Box>
  );
}
