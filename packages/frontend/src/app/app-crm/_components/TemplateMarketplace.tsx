"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Rating,
  Avatar,
  IconButton,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Store as MarketplaceIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";

interface MarketplaceTemplate {
  id: number;
  name: string;
  description: string;
  phase: string;
  effort_hours: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  rating: number;
  downloads: number;
  views: number;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  preview_image?: string;
  is_featured: boolean;
  is_premium: boolean;
  documentation?: string;
}

interface TemplateMarketplaceProps {
  open: boolean;
  onClose: () => void;
  onImportTemplate: (template: MarketplaceTemplate) => void;
}

const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
  open,
  onClose,
  onImportTemplate,
}) => {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [tabValue, setTabValue] = useState(0);

  // Mock data for demonstration
  const mockTemplates: MarketplaceTemplate[] = [
    {
      id: 1,
      name: "Wedding Ceremony Package",
      description:
        "Complete template for wedding ceremony coverage including all essential shots and moments",
      phase: "Production",
      effort_hours: "6.0",
      pricing_type: "Fixed",
      fixed_price: 1200,
      author: {
        name: "ProWedding Studios",
        verified: true,
      },
      rating: 4.8,
      downloads: 1543,
      views: 3201,
      tags: ["wedding", "ceremony", "premium"],
      category: "Wedding",
      created_at: "2024-01-15",
      updated_at: "2024-03-10",
      is_featured: true,
      is_premium: true,
    },
    {
      id: 2,
      name: "Corporate Event Essentials",
      description:
        "Standard template for corporate events, conferences, and business gatherings",
      phase: "Production",
      effort_hours: "4.0",
      pricing_type: "Hourly",
      author: {
        name: "CorpVideo Pro",
        verified: true,
      },
      rating: 4.5,
      downloads: 892,
      views: 1876,
      tags: ["corporate", "business", "professional"],
      category: "Corporate",
      created_at: "2024-02-01",
      updated_at: "2024-02-15",
      is_featured: false,
      is_premium: false,
    },
    {
      id: 3,
      name: "Social Media Content Pack",
      description: "Quick templates for social media video content creation",
      phase: "Post-Production",
      effort_hours: "2.0",
      pricing_type: "Fixed",
      fixed_price: 300,
      author: {
        name: "SocialVid Creator",
        verified: false,
      },
      rating: 4.2,
      downloads: 2103,
      views: 4521,
      tags: ["social", "quick", "content"],
      category: "Social Media",
      created_at: "2024-03-01",
      updated_at: "2024-03-20",
      is_featured: false,
      is_premium: false,
    },
  ];

  useEffect(() => {
    if (open) {
      fetchMarketplaceTemplates();
    }
  }, [open]);

  const fetchMarketplaceTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call - in real implementation, this would fetch from marketplace API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTemplates(mockTemplates);
    } catch {
      setError("Failed to fetch marketplace templates");
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.downloads - a.downloads;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "trending":
        return b.views - a.views;
      default:
        return 0;
    }
  });

  const categories = [
    "all",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];

  const handleImport = async (template: MarketplaceTemplate) => {
    try {
      // Simulate import process
      await new Promise((resolve) => setTimeout(resolve, 500));
      onImportTemplate(template);
    } catch {
      setError("Failed to import template");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <MarketplaceIcon />
          <Typography variant="h6">Template Marketplace</Typography>
          <Chip label="Community" color="primary" size="small" />
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          sx={{ mb: 3 }}
        >
          <Tab label="Browse Templates" />
          <Tab label="My Uploads" />
          <Tab label="Favorites" />
        </Tabs>

        {tabValue === 0 && (
          <>
            {/* Search and Filters */}
            <Box display="flex" gap={2} mb={3}>
              <TextField
                label="Search templates"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <TextField
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                SelectProps={{ native: true }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                SelectProps={{ native: true }}
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
                <option value="trending">Trending</option>
              </TextField>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {sortedTemplates.map((template) => (
                  <Grid item xs={12} md={6} lg={4} key={template.id}>
                    <Card sx={{ height: "100%", position: "relative" }}>
                      {template.is_featured && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 1,
                          }}
                        >
                          <Chip
                            label="Featured"
                            color="primary"
                            size="small"
                            icon={<StarIcon />}
                          />
                        </Box>
                      )}

                      {template.is_premium && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            zIndex: 1,
                          }}
                        >
                          <Chip label="Premium" color="warning" size="small" />
                        </Box>
                      )}

                      <CardContent>
                        <Typography variant="h6" gutterBottom noWrap>
                          {template.name}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {template.author.name[0]}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {template.author.name}
                          </Typography>
                          {template.author.verified && (
                            <VerifiedIcon
                              color="primary"
                              sx={{ fontSize: 16 }}
                            />
                          )}
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {template.description}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Rating
                            value={template.rating}
                            readOnly
                            size="small"
                          />
                          <Typography variant="caption">
                            ({template.rating})
                          </Typography>
                        </Box>

                        <Box display="flex" gap={1} mb={2}>
                          {template.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>

                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box display="flex" gap={2}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <DownloadIcon fontSize="small" />
                              <Typography variant="caption">
                                {template.downloads}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <ViewIcon fontSize="small" />
                              <Typography variant="caption">
                                {template.views}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="subtitle2" color="primary">
                            {template.pricing_type === "Fixed"
                              ? `$${template.fixed_price}`
                              : `${template.effort_hours}h`}
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleImport(template)}
                        >
                          Import
                        </Button>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small">
                          <ShareIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {tabValue === 1 && (
          <Box textAlign="center" py={8}>
            <UploadIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Share Your Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Upload your templates to help the community and earn recognition
            </Typography>
            <Button variant="contained" startIcon={<UploadIcon />}>
              Upload Template
            </Button>
          </Box>
        )}

        {tabValue === 2 && (
          <Box textAlign="center" py={8}>
            <StarIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Your Favorites
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Templates you&apos;ve favorited will appear here
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateMarketplace;
