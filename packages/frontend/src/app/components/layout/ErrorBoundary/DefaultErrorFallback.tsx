"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

export function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        p: 3,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 600, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Something went wrong</AlertTitle>
          An unexpected error occurred. Please try refreshing the page or
          contact support if the problem persists.
        </Alert>

        <Typography variant="h6" gutterBottom>
          Error Details
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, fontFamily: "monospace" }}
        >
          {error.message}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={retry}>
            Try Again
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
