"use client";

import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Link from "next/link";

export default function NewFilmPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          href="/designer/films"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Films
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Film Template
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Build a new film template with scenes and configuration
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Alert severity="info">
            The film template builder is coming soon! This will include:
            <ul>
              <li>Visual scene composition</li>
              <li>Timeline management</li>
              <li>Template configuration</li>
              <li>Scene library integration</li>
            </ul>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
