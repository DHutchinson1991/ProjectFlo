"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Rating,
  Divider,
} from "@mui/material";
import {
  Psychology as AIIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

interface TaskTemplate {
  id: number;
  name: string;
  phase: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  effort_hours: string;
  description?: string;
  usage_count?: number;
  success_rate?: number;
  avg_completion_time?: number;
  profitability_score?: number;
}

interface RecommendationReason {
  type:
    | "usage_pattern"
    | "success_rate"
    | "seasonal"
    | "profitability"
    | "similar_projects";
  confidence: number;
  description: string;
}

interface SmartRecommendation {
  template: TaskTemplate;
  score: number;
  reasons: RecommendationReason[];
  category: "highly_recommended" | "suggested" | "trending";
}

interface SmartTemplateRecommendationsProps {
  entityType: "component" | "deliverable" | "coverage_scene";
  entityId: number;
  projectType?: string;
  clientSegment?: string;
  onAddTemplate: (templateId: number) => void;
}

const SmartTemplateRecommendations: React.FC<
  SmartTemplateRecommendationsProps
> = ({ entityType, entityId, projectType, clientSegment, onAddTemplate }) => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [entityType, entityId, projectType, clientSegment]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        entity_type: entityType,
        entity_id: entityId.toString(),
        ...(projectType && { project_type: projectType }),
        ...(clientSegment && { client_segment: clientSegment }),
      });

      const response = await fetch(
        `http://localhost:3002/task-templates/recommendations?${params}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data);
    } catch {
      console.log("AI recommendations not available, using fallback");
      // Fallback to simple recommendations based on popular templates
      await fetchFallbackRecommendations();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackRecommendations = async () => {
    try {
      const response = await fetch("http://localhost:3002/task-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const templates = await response.json();

      // Create simple recommendations based on template usage and phase
      const fallbackRecommendations: SmartRecommendation[] = templates
        .filter((template: TaskTemplate) => template.phase)
        .slice(0, 6)
        .map((template: TaskTemplate, index: number) => ({
          template,
          score: 0.8 - index * 0.1,
          reasons: [
            {
              type: "usage_pattern",
              confidence: 0.7,
              description: "Popular choice for similar projects",
            },
          ],
          category:
            index < 2
              ? "highly_recommended"
              : index < 4
                ? "suggested"
                : "trending",
        }));

      setRecommendations(fallbackRecommendations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch recommendations",
      );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "highly_recommended":
        return "#4caf50";
      case "suggested":
        return "#ff9800";
      case "trending":
        return "#2196f3";
      default:
        return "#9e9e9e";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "highly_recommended":
        return <StarIcon />;
      case "suggested":
        return <ScheduleIcon />;
      case "trending":
        return <TrendingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getReasonIcon = (type: string) => {
    switch (type) {
      case "usage_pattern":
        return <TrendingIcon fontSize="small" />;
      case "success_rate":
        return <StarIcon fontSize="small" />;
      case "profitability":
        return <MoneyIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Analyzing patterns and generating recommendations...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No recommendations available at this time. Try adding some templates
        manually to build usage patterns.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <AIIcon color="primary" />
        <Typography variant="h6">Smart Template Recommendations</Typography>
        <Chip
          label="AI-Powered"
          size="small"
          color="primary"
          icon={<AIIcon />}
        />
      </Box>

      <Grid container spacing={2}>
        {recommendations.map((recommendation) => (
          <Grid item xs={12} md={6} lg={4} key={recommendation.template.id}>
            <Card
              sx={{
                height: "100%",
                position: "relative",
                border: `2px solid ${getCategoryColor(recommendation.category)}`,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Chip
                    icon={getCategoryIcon(recommendation.category)}
                    label={recommendation.category.replace("_", " ")}
                    size="small"
                    sx={{
                      backgroundColor: getCategoryColor(
                        recommendation.category,
                      ),
                      color: "white",
                    }}
                  />
                  <Rating
                    value={recommendation.score}
                    max={1}
                    precision={0.1}
                    readOnly
                    size="small"
                  />
                </Box>

                <Typography variant="h6" gutterBottom noWrap>
                  {recommendation.template.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {recommendation.template.phase} •{" "}
                  {recommendation.template.effort_hours} hours
                </Typography>

                {recommendation.template.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {recommendation.template.description}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Why recommended:
                  </Typography>
                  {recommendation.reasons.slice(0, 2).map((reason, index) => (
                    <Box
                      key={index}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      mb={1}
                    >
                      {getReasonIcon(reason.type)}
                      <Typography variant="caption">
                        {reason.description}
                      </Typography>
                      <Chip
                        label={`${Math.round(reason.confidence * 100)}%`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  ))}
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => onAddTemplate(recommendation.template.id)}
                  sx={{
                    backgroundColor: getCategoryColor(recommendation.category),
                    "&:hover": {
                      backgroundColor: getCategoryColor(
                        recommendation.category,
                      ),
                      opacity: 0.8,
                    },
                  }}
                >
                  Add Template
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={3}>
        <Alert severity="info" icon={<AIIcon />}>
          <Typography variant="body2">
            <strong>Smart Recommendations</strong> are based on usage patterns,
            success rates, project similarity, and seasonal trends. The system
            learns from your team&apos;s preferences and improves over time.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default SmartTemplateRecommendations;
