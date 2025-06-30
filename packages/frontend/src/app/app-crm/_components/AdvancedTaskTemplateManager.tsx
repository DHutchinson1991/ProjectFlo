"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Analytics as AnalyticsIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Psychology as AIIcon,
  Store as MarketplaceIcon,
} from "@mui/icons-material";
import TaskTemplateAnalytics from "./TaskTemplateAnalytics";
import BulkTaskOperations from "./BulkTaskOperations";
import SmartTemplateRecommendations from "./SmartTemplateRecommendations";
import TemplateVersioningManager from "./TemplateVersioningManager";
import TemplateComparison from "./TemplateComparison";
import TemplateMarketplace from "./TemplateMarketplace";

interface AdvancedTaskTemplateManagerProps {
  entityType: "component" | "deliverable" | "coverage_scene";
  entityId: number;
  entityName: string;
}

interface TaskTemplate {
  id: number;
  name: string;
  phase: string;
  pricing_type: "Hourly" | "Fixed";
  fixed_price?: number;
  effort_hours: string;
  description?: string;
  category?: string;
  entity_type_preference?: string[];
  usage_count?: number;
  effectiveness_score?: number;
  created_at: string;
  updated_at: string;
}

interface TaskTemplateCategory {
  name: string;
  description: string;
  entityTypes: string[];
  templates: TaskTemplate[];
  color: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AdvancedTaskTemplateManager: React.FC<
  AdvancedTaskTemplateManagerProps
> = ({ entityType, entityId, entityName }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [categories, setCategories] = useState<TaskTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  // Dialog state for advanced features
  const [versioningDialogOpen, setVersioningDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [selectedTemplateForVersioning, setSelectedTemplateForVersioning] =
    useState<number | null>(null);

  // Predefined categories with entity type targeting
  const defaultCategories: TaskTemplateCategory[] = [
    {
      name: "Pre-Production",
      description: "Planning and preparation tasks",
      entityTypes: ["component", "deliverable", "coverage_scene"],
      templates: [],
      color: "#1976d2",
    },
    {
      name: "Production",
      description: "Filming and capture tasks",
      entityTypes: ["component", "coverage_scene"],
      templates: [],
      color: "#388e3c",
    },
    {
      name: "Post-Production",
      description: "Editing and finishing tasks",
      entityTypes: ["component", "deliverable"],
      templates: [],
      color: "#f57c00",
    },
    {
      name: "Delivery",
      description: "Final delivery and client handoff",
      entityTypes: ["deliverable"],
      templates: [],
      color: "#7b1fa2",
    },
    {
      name: "Quality Control",
      description: "Review and approval tasks",
      entityTypes: ["component", "deliverable"],
      templates: [],
      color: "#d32f2f",
    },
    {
      name: "Client Communication",
      description: "Client interaction and updates",
      entityTypes: ["deliverable"],
      templates: [],
      color: "#0288d1",
    },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:3002/task-templates");
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }

      const templatesData = await response.json();
      setTemplates(templatesData);

      // Organize templates into categories
      const categorizedTemplates =
        organizeByCategoriesAndEntityType(templatesData);
      setCategories(categorizedTemplates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates",
      );
    } finally {
      setLoading(false);
    }
  };

  const organizeByCategoriesAndEntityType = (
    templatesData: TaskTemplate[],
  ): TaskTemplateCategory[] => {
    const categorizedTemplates = defaultCategories.map((category) => ({
      ...category,
      templates: templatesData.filter((template) => {
        const phase = template.phase || "Miscellaneous";
        const categoryMatch =
          phase.toLowerCase().includes(category.name.toLowerCase()) ||
          category.name.toLowerCase().includes(phase.toLowerCase());

        const entityMatch =
          category.entityTypes.includes(entityType) ||
          (template.entity_type_preference &&
            template.entity_type_preference.includes(entityType));

        return categoryMatch && entityMatch;
      }),
    }));

    // Add miscellaneous category for unmatched templates
    const miscTemplates = templatesData.filter((template) => {
      const phase = template.phase || "Miscellaneous";
      return !defaultCategories.some(
        (cat) =>
          phase.toLowerCase().includes(cat.name.toLowerCase()) ||
          cat.name.toLowerCase().includes(phase.toLowerCase()),
      );
    });

    if (miscTemplates.length > 0) {
      categorizedTemplates.push({
        name: "Miscellaneous",
        description: "Other templates",
        entityTypes: ["component", "deliverable", "coverage_scene"],
        templates: miscTemplates,
        color: "#616161",
      });
    }

    return categorizedTemplates;
  };

  const getFilteredTemplates = (categoryTemplates: TaskTemplate[]) => {
    return categoryTemplates
      .filter((template) => {
        const matchesSearch =
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.description &&
            template.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));

        const matchesPhase =
          selectedPhase === "all" || template.phase === selectedPhase;

        return matchesSearch && matchesPhase;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "usage":
            return (b.usage_count || 0) - (a.usage_count || 0);
          case "effectiveness":
            return (b.effectiveness_score || 0) - (a.effectiveness_score || 0);
          case "recent":
            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            );
          default:
            return a.name.localeCompare(b.name);
        }
      });
  };

  const handleAddTaskFromTemplate = async (template: TaskTemplate) => {
    try {
      const taskData = {
        task_name: template.name,
        estimated_hours: parseFloat(template.effort_hours) || 1,
        task_template_id: template.id,
        order_index: templates.length,
      };

      const response = await fetch(
        `http://localhost:3002/api/entities/${entityType}/${entityId}/default-tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        },
      );

      if (response.ok) {
        // Trigger refresh in parent component
        window.location.reload(); // Temporary - in production, use proper state management
      } else {
        const errorData = await response.json();
        setError(`Failed to add task: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    }
  };

  const handleAddFromTemplate = async (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      await handleAddTaskFromTemplate(template);
    }
  };

  const handleImportFromMarketplace = async (marketplaceTemplate: {
    name: string;
    phase: string;
    pricing_type: "Hourly" | "Fixed";
    fixed_price?: number;
    effort_hours: string;
    description?: string;
  }) => {
    try {
      // Convert marketplace template to local template format
      const templateData = {
        name: marketplaceTemplate.name,
        phase: marketplaceTemplate.phase,
        pricing_type: marketplaceTemplate.pricing_type,
        fixed_price: marketplaceTemplate.fixed_price,
        effort_hours: marketplaceTemplate.effort_hours,
        description: marketplaceTemplate.description,
      };

      const response = await fetch("http://localhost:3002/task-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        await fetchTemplates(); // Refresh templates
      } else {
        setError("Failed to import template from marketplace");
      }
    } catch {
      setError("Failed to import template from marketplace");
    }
  };

  const formatHours = (hours: string | number) => {
    const h = typeof hours === "string" ? parseFloat(hours) : hours;
    return h === 1 ? "1 hour" : `${h} hours`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getPhases = () => {
    const phases = Array.from(
      new Set(templates.map((t) => t.phase).filter(Boolean)),
    );
    return phases.sort();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">Advanced Task Templates</Typography>
            <Chip
              label={`${templates.length} templates`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`For ${entityName}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: "100%" }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Enhanced Controls */}
            <Box sx={{ mb: 3 }}>
              <Tabs
                value={currentTab}
                onChange={(_, newValue) => setCurrentTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab
                  label="Browse Templates"
                  icon={<CategoryIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="Analytics"
                  icon={<AnalyticsIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="Bulk Operations"
                  icon={<AssignmentIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="AI Recommendations"
                  icon={<AIIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="Marketplace"
                  icon={<MarketplaceIcon />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
              {/* Search and Filter Controls */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Search Templates"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Phase Filter</InputLabel>
                    <Select
                      value={selectedPhase}
                      label="Phase Filter"
                      onChange={(e) => setSelectedPhase(e.target.value)}
                    >
                      <MenuItem value="all">All Phases</MenuItem>
                      {getPhases().map((phase) => (
                        <MenuItem key={phase} value={phase}>
                          {phase}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="usage">Most Used</MenuItem>
                      <MenuItem value="effectiveness">Most Effective</MenuItem>
                      <MenuItem value="recent">Recently Updated</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedPhase("all");
                      setSortBy("name");
                    }}
                    sx={{ height: "56px" }}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {/* Category-based Template Display */}
              {categories
                .filter((category) => category.templates.length > 0)
                .map((category) => (
                  <Card key={category.name} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <CategoryIcon sx={{ color: category.color }} />
                        <Typography variant="h6" sx={{ color: category.color }}>
                          {category.name}
                        </Typography>
                        <Chip
                          label={`${getFilteredTemplates(category.templates).length} templates`}
                          size="small"
                          sx={{ bgcolor: category.color, color: "white" }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {category.description}
                      </Typography>

                      <List disablePadding>
                        {getFilteredTemplates(category.templates).map(
                          (template) => (
                            <ListItem
                              key={template.id}
                              sx={{
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                mb: 1,
                                border: 1,
                                borderColor: "divider",
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Typography variant="body1">
                                      {template.name}
                                    </Typography>
                                    {template.usage_count &&
                                      template.usage_count > 10 && (
                                        <StarIcon
                                          sx={{ color: "gold", fontSize: 16 }}
                                        />
                                      )}
                                  </Box>
                                }
                                secondary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 1,
                                      mt: 0.5,
                                    }}
                                  >
                                    <Chip
                                      label={template.phase}
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                    />
                                    <Chip
                                      icon={<ScheduleIcon />}
                                      label={formatHours(template.effort_hours)}
                                      size="small"
                                      variant="outlined"
                                    />
                                    {template.pricing_type === "Fixed" &&
                                      template.fixed_price && (
                                        <Chip
                                          icon={<MoneyIcon />}
                                          label={formatPrice(
                                            template.fixed_price,
                                          )}
                                          size="small"
                                          variant="outlined"
                                          color="success"
                                        />
                                      )}
                                    {template.usage_count && (
                                      <Chip
                                        icon={<TrendingUpIcon />}
                                        label={`Used ${template.usage_count}x`}
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                      />
                                    )}
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() =>
                                    handleAddTaskFromTemplate(template)
                                  }
                                  sx={{ mr: 1 }}
                                >
                                  Add Task
                                </Button>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ),
                        )}
                      </List>

                      {getFilteredTemplates(category.templates).length ===
                        0 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: "center", py: 2 }}
                        >
                          No templates match your current filters.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
              <TaskTemplateAnalytics />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <BulkTaskOperations
                entityType={entityType}
                entityId={entityId}
                entityName={entityName}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
              <SmartTemplateRecommendations
                entityType={entityType}
                entityId={entityId}
                onAddTemplate={handleAddFromTemplate}
              />
            </TabPanel>

            <TabPanel value={currentTab} index={4}>
              <TemplateMarketplace
                open={true}
                onClose={() => {}}
                onImportTemplate={handleImportFromMarketplace}
              />
            </TabPanel>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Advanced Feature Dialogs */}
      {selectedTemplateForVersioning && (
        <TemplateVersioningManager
          templateId={selectedTemplateForVersioning}
          open={versioningDialogOpen}
          onClose={() => {
            setVersioningDialogOpen(false);
            setSelectedTemplateForVersioning(null);
          }}
        />
      )}

      <TemplateComparison
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
      />
    </Box>
  );
};

export default AdvancedTaskTemplateManager;
