"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActionArea,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People as SubjectsIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useBrand } from "@/app/providers/BrandProvider";

interface SubjectType {
  id: number;
  role_name: string;
  description?: string;
  brand_id: number;
  is_core: boolean;
  is_group: boolean;
  never_group: boolean;
  order_index: number;
}

export const SubjectsManagerCard: React.FC = () => {
  const { currentBrand } = useBrand();
  const [templates, setTemplates] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentBrand?.id) {
      loadTemplates();
    }
  }, [currentBrand?.id]);

  const loadTemplates = async () => {
    if (!currentBrand?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3002/subjects/roles/brand/${currentBrand.id}`
      );
      if (!res.ok) throw new Error("Failed to load templates");
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          elevation: 4,
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardActionArea
        component={Link}
        href="/designer/subjects-templates"
        sx={{ height: "100%" }}
      >
        <CardContent sx={{ p: 3, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <SubjectsIcon
              sx={{
                fontSize: 32,
                color: "#9c27b0",
                mr: 2,
              }}
            />
            <Typography variant="h6" component="h2">
              Subjects Manager
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Create and manage role templates (like "Wedding" with Bride, Groom, etc.). These become defaults when adding subjects to films.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <CircularProgress size={24} sx={{ mt: 2 }} />
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">
                {templates.length} template{templates.length !== 1 ? "s" : ""} available
              </Typography>

              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {templates.slice(0, 3).map((template) => (
                  <Chip
                    key={template.id}
                    label={template.role_name}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {templates.length > 3 && (
                  <Typography variant="caption" sx={{ alignSelf: "center", ml: 1 }}>
                    +{templates.length - 3} more
                  </Typography>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
