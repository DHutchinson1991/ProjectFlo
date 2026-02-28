'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Stack,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';

interface WeddingType {
  id: number;
  name: string;
  description: string;
  total_duration_hours: number;
  event_start_time: string;
  typical_guest_count?: number;
  locations: Array<{
    id: number;
    name: string;
    location_type?: string;
    order_index: number;
    is_primary: boolean;
  }>;
  subjects: Array<{
    id: number;
    name: string;
    subject_type?: string;
    typical_count?: number;
    order_index: number;
    is_primary: boolean;
  }>;
  activities: Array<{
    id: number;
    name: string;
    duration_minutes: number;
    start_time_offset_minutes: number;
    icon?: string;
    color?: string;
    moments: Array<{
      id: number;
      name: string;
      duration_seconds: number;
      is_key_moment: boolean;
    }>;
    activity_locations?: Array<{
      id: number;
      wedding_type_location_id: number;
      location_sequence_index: number;
      wedding_type_location: {
        id: number;
        name: string;
        location_type?: string;
      };
    }>;
    activity_subjects?: Array<{
      id: number;
      wedding_type_subject_id: number;
      presence_percentage?: number;
      is_primary_focus: boolean;
      wedding_type_subject: {
        id: number;
        name: string;
        subject_type?: string;
      };
    }>;
  }>;
}

interface WeddingTypeSelectorProps {
  onPackageCreated?: (packageId: number) => void;
  isLoading?: boolean;
}

/**
 * WeddingTypeSelector Component
 * 
 * Displays all available wedding type templates.
 * Users can:
 * 1. Browse wedding types with activities and moments
 * 2. Expand to see detailed moments
 * 3. Enter a custom package name
 * 4. Select and create a package from the template
 */
export default function WeddingTypeSelector({
  onPackageCreated,
  isLoading: externalIsLoading,
}: WeddingTypeSelectorProps) {
  const { currentBrand } = useBrand();
  const [weddingTypes, setWeddingTypes] = useState<WeddingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeddingTypeId, setSelectedWeddingTypeId] = useState<number | null>(null);
  const [packageName, setPackageName] = useState('');
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(null);
  const [creatingPackage, setCreatingPackage] = useState(false);

  // ─── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    loadWeddingTypes();
  }, [currentBrand?.id]);

  // ─── API Calls ────────────────────────────────────────────────────
  const loadWeddingTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentBrand?.id) {
        setError('Brand context not available');
        setLoading(false);
        return;
      }
      const response = await api.weddingTypes.getAll(currentBrand.id);
      setWeddingTypes(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wedding types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!selectedWeddingTypeId || !packageName.trim()) {
      setError('Please select a wedding type and enter a package name');
      return;
    }

    setCreatingPackage(true);
    try {
      // Call the API to create the package from template
      const response = await api.weddingTypes.createPackageFromTemplate(selectedWeddingTypeId, {
        packageName,
      }, currentBrand?.id || 1);
      
      // Extract package ID from response
      // The response will be the full service_packages object with id at the top level
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const packageId = (response as any)?.id;
      
      if (packageId && onPackageCreated) {
        onPackageCreated(packageId);
      } else if (!packageId) {
        setError('Failed to extract package ID from response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create package');
      setCreatingPackage(false);
    }
  };

  // ─── Computed Values ───────────────────────────────────────────────
  const selectedWeddingType = weddingTypes.find((wt) => wt.id === selectedWeddingTypeId);
  const isReadyToCreate = selectedWeddingTypeId && packageName.trim().length > 0;

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading || externalIsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Wedding Types List */}
          <Grid item xs={selectedWeddingTypeId ? 6 : 12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#ffffff' }}>
              Select a Wedding Type
            </Typography>

            <Stack spacing={1.5} sx={{ maxHeight: '600px', overflow: 'auto', pr: 1 }}>
              {weddingTypes.map((wt) => (
                <Card
                  key={wt.id}
                  onClick={() => setSelectedWeddingTypeId(wt.id)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedWeddingTypeId === wt.id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.03)',
                    border:
                      selectedWeddingTypeId === wt.id ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    },
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                  }}
                >
                  <CardHeader
                    title={wt.name}
                    subheader={wt.description}
                    titleTypographyProps={{ variant: 'subtitle1', sx: { color: '#ffffff', fontWeight: 600 } }}
                    subheaderTypographyProps={{ variant: 'caption', sx: { color: '#94a3b8' } }}
                    sx={{ pb: 1 }}
                  />

                  <CardContent sx={{ pt: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={`${wt.total_duration_hours}h`}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#e2e8f0' }}
                      />
                      <Chip
                        icon={<EventIcon />}
                        label={wt.event_start_time}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#e2e8f0' }}
                      />
                      {wt.typical_guest_count && (
                        <Chip
                          icon={<GroupIcon />}
                          label={`~${wt.typical_guest_count} guests`}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#e2e8f0' }}
                        />
                      )}
                    </Stack>

                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {wt.activities.length} activities
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>

          {/* Selected Wedding Type Details */}
          {selectedWeddingType && (
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#ffffff' }}>
                {selectedWeddingType.name}
              </Typography>

              {/* Locations Section */}
              {selectedWeddingType.locations && selectedWeddingType.locations.length > 0 && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(15, 23, 42, 0.6)', borderRadius: 1, borderLeft: '3px solid #10b981' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#10b981', mb: 1, display: 'block' }}>
                    📍 LOCATIONS ({selectedWeddingType.locations.length})
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {selectedWeddingType.locations.map((loc) => (
                      <Chip
                        key={loc.id}
                        label={loc.name}
                        size="small"
                        variant={loc.is_primary ? 'filled' : 'outlined'}
                        sx={{
                          backgroundColor: loc.is_primary ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          color: loc.is_primary ? '#10b981' : '#94a3b8',
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Subjects Section */}
              {selectedWeddingType.subjects && selectedWeddingType.subjects.length > 0 && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(15, 23, 42, 0.6)', borderRadius: 1, borderLeft: '3px solid #f59e0b' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#f59e0b', mb: 1, display: 'block' }}>
                    👥 PEOPLE ({selectedWeddingType.subjects.length})
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {selectedWeddingType.subjects.map((subj) => (
                      <Chip
                        key={subj.id}
                        label={`${subj.name}${subj.typical_count ? ` (${subj.typical_count})` : ''}`}
                        size="small"
                        variant={subj.is_primary ? 'filled' : 'outlined'}
                        sx={{
                          backgroundColor: subj.is_primary ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                          borderColor: 'rgba(245, 158, 11, 0.3)',
                          color: subj.is_primary ? '#f59e0b' : '#94a3b8',
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Typography variant="caption" sx={{ fontWeight: 600, color: '#cbd5e1', mb: 1, display: 'block' }}>
                📋 ACTIVITIES ({selectedWeddingType.activities.length})
              </Typography>

              <Stack spacing={1.5} sx={{ maxHeight: '400px', overflow: 'auto', mb: 2, pr: 1 }}>
                {selectedWeddingType.activities.map((activity) => (
                  <Card 
                    key={activity.id} 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5,
                      bgcolor: 'rgba(15, 23, 42, 0.6)',
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        setExpandedActivityId(
                          expandedActivityId === activity.id ? null : activity.id,
                        )
                      }
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                          {activity.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {activity.duration_minutes} min
                        </Typography>
                      </Box>

                      <IconButton size="small" sx={{ ml: 1 }}>
                        {expandedActivityId === activity.id ? (
                          <ExpandLessIcon sx={{ color: '#f59e0b' }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: '#94a3b8' }} />
                        )}
                      </IconButton>
                    </Box>

                    <Collapse in={expandedActivityId === activity.id} timeout="auto">
                      {/* Activity Subjects */}
                      {activity.activity_subjects && activity.activity_subjects.length > 0 && (
                        <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, display: 'block', mb: 0.5 }}>
                            Subjects:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {activity.activity_subjects.map((as) => (
                              <Chip
                                key={as.id}
                                label={as.wedding_type_subject.name}
                                size="small"
                                variant={as.is_primary_focus ? 'filled' : 'outlined'}
                                sx={{
                                  backgroundColor: as.is_primary_focus ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                  borderColor: 'rgba(245, 158, 11, 0.2)',
                                  color: '#e2e8f0',
                                  fontSize: '0.7rem',
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Moments List */}
                      <List sx={{ pt: 1, pl: 2 }}>
                        {activity.moments.map((moment) => {
                          const minutes = Math.floor(moment.duration_seconds / 60);
                          const seconds = moment.duration_seconds % 60;
                          let durationLabel = '';
                          if (minutes > 0) {
                            durationLabel = `${minutes}m ${seconds}s`;
                          } else {
                            durationLabel = `${seconds}s`;
                          }

                          return (
                            <ListItem key={moment.id} sx={{ py: 0.5, px: 0 }} dense>
                              <ListItemText
                                primary={moment.name}
                                secondary={`${durationLabel}${moment.is_key_moment ? ' ⭐ Key Moment' : ''}`}
                                primaryTypographyProps={{ variant: 'caption', sx: { color: '#e2e8f0' } }}
                                secondaryTypographyProps={{ variant: 'caption', sx: { color: moment.is_key_moment ? '#f59e0b' : '#94a3b8' } }}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Card>
                ))}
              </Stack>

              {/* Package Name Input */}
              <TextField
                label="Package Name"
                fullWidth
                size="small"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder={`e.g., ${selectedWeddingType.name} Package 2024`}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#e2e8f0',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#64748b',
                    opacity: 1,
                  },
                }}
              />

              {/* Create Button */}
              <Button
                onClick={handleCreatePackage}
                variant="contained"
                disabled={!selectedWeddingTypeId || !packageName.trim() || creatingPackage}
                fullWidth
                sx={{
                  bgcolor: '#f59e0b',
                  color: '#0f172a',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: '#d97706',
                  },
                  '&:disabled': {
                    bgcolor: '#64748b',
                    color: '#475569',
                  },
                }}
              >
                {creatingPackage ? <CircularProgress size={24} sx={{ mr: 1 }} /> : 'Create Package'}
              </Button>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
