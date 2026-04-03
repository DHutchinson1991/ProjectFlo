import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Autocomplete,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
// Import equipment category enum if you need it
import { EquipmentCategory } from '@/features/workflow/equipment/types/equipment.types';
import {
  CoverageType,
  ShotType,
  CameraMovement,
  AudioEquipment,
  VideoStyleType
} from '../types';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';

// Re-using the interface from the parent page for consistency
interface CreateCoverageForm {
  name: string;
  description: string;
  coverage_type: CoverageType;
  subjects: number[];
  operator: string;
  notes: string;
  lens_focal_length: string;
  aperture: string;
  audio_pattern: string;
  frequency_response: string;
  crew_id: number | null;
  video_style_type: VideoStyleType | null;
  shot_type: ShotType | undefined;
  camera_movement: CameraMovement | undefined;
  audio_equipment: AudioEquipment | undefined;
  // Optional legacy fields if passed
  shot_size?: string;
  shot_movement?: string;
  job_role_id?: number;
  resource_requirements?: { category: string; quantity: number }[];
}

interface CreateCoverageDialogProps {
  open: boolean;
  onClose: () => void;
  coverageForm: CreateCoverageForm;
  setCoverageForm: (form: CreateCoverageForm) => void;
  creating: boolean;
  onCreate: () => void;
  jobRoles?: Array<{id: number; name: string}>;
  availableSubjects?: Array<{
    id: number;
    subject: {
        id: number;
        first_name: string;
        last_name: string | null;
        context_role: string;
    }
  }>;
  availableCrew?: Array<{
    id: number;
    contact: {
        first_name: string;
        last_name: string;
    }
  }>;
  [key: string]: any; // Catch-all for other props
  nextAssignmentNumber?: string;
}

export default function CreateCoverageDialog({
  open,
  onClose,
  coverageForm,
  setCoverageForm,
  creating,
  onCreate,
  jobRoles = [],
  availableSubjects = [],
  availableCrew = [],
  availableEquipment = [],
  selectedEquipment = [],
  setSelectedEquipment,
  nextAssignmentNumber,
  isEditing = false
}: CreateCoverageDialogProps & { 
  availableEquipment?: any[]; 
  selectedEquipment?: any[]; 
  setSelectedEquipment?: (eq: any[]) => void;
  isEditing?: boolean;
}) {

  const handleChange = (field: keyof CreateCoverageForm, value: any) => {
    setCoverageForm({
      ...coverageForm,
      [field]: value
    });
  };

  const handleAddResource = () => {
      const current = coverageForm.resource_requirements || [];
      // Default to CAMERA with quantity 1
      handleChange('resource_requirements', [...current, { category: 'CAMERA', quantity: 1 }]);
  };

  const handleUpdateResource = (index: number, field: 'category' | 'quantity', value: any) => {
     const current = [...(coverageForm.resource_requirements || [])];
     
     // Special logic for CAMERA category
     if (field === 'category' && value === 'CAMERA') {
         // Changing TO Camera, reset quantity to 1
         current[index] = { ...current[index], category: value, quantity: 1 };
     } else if (field === 'quantity' && current[index].category === 'CAMERA') {
         // Changing Quantity of Camera, max at 1
         current[index] = { ...current[index], quantity: Math.min(value, 1) };
     } else {
         current[index] = { ...current[index], [field]: value };
     }
     
     handleChange('resource_requirements', current);
  };

  const handleRemoveResource = (index: number) => {
      const current = [...(coverageForm.resource_requirements || [])];
      current.splice(index, 1);
      handleChange('resource_requirements', current);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: CoverageType) => {
    setCoverageForm({
      ...coverageForm,
      coverage_type: newValue
    });
  };

  // Check validity
  const isValid = true;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
                {creating ? 'Saving...' : (isEditing ? 'Edit Coverage' : 'Create New Coverage')} 
            </Typography>
            {nextAssignmentNumber && (
                <Chip 
                    label={`ID: ${nextAssignmentNumber}`} 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                />
            )}
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={coverageForm.coverage_type} onChange={handleTabChange} aria-label="coverage type tabs">
          <Tab 
            icon={<VideocamIcon />} 
            iconPosition="start" 
            label="Video Coverage" 
            value="VIDEO" 
          />
          <Tab 
            icon={<MicIcon />} 
            iconPosition="start" 
            label="Audio Coverage" 
            value="AUDIO" 
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          {/* Job Role Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
                <InputLabel>Job Role</InputLabel>
                <Select
                    value={coverageForm.job_role_id || ''}
                    label="Job Role"
                    onChange={(e) => handleChange('job_role_id', e.target.value === '' ? undefined : Number(e.target.value))}
                >
                    <MenuItem value=""><em>Unassigned</em></MenuItem>
                    {jobRoles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                            {role.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
              {/* Spacer or additional meta info */}
          </Grid>

          {/* Resource Requirements Section */}
          <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">Resource Requirements</Typography>
                  <Button startIcon={<AddCircleIcon />} size="small" onClick={handleAddResource}>
                      Add
                  </Button>
              </Box>
              {(coverageForm.resource_requirements || []).length === 0 && (
                   <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                       No specific equipment requirements listed.
                   </Typography>
              )}
              {(coverageForm.resource_requirements || []).map((req, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 1, alignItems: 'center' }}>
                      <Grid item xs={11}>
                          <FormControl fullWidth size="small">
                              <InputLabel>Category</InputLabel>
                              <Select
                                  value={req.category}
                                  label="Category"
                                  onChange={(e) => handleUpdateResource(index, 'category', e.target.value)}
                              >
                                  {Object.keys(EquipmentCategory).map((cat) => (
                                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                  ))}
                              </Select>
                          </FormControl>
                      </Grid>
                      <Grid item xs={1}>
                          <IconButton onClick={() => handleRemoveResource(index)} color="error" size="small">
                              <DeleteIcon />
                          </IconButton>
                      </Grid>
                  </Grid>
              ))}
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={coverageForm.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>

          {/* Subjects Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
                <InputLabel>Subjects in Shot/Audio</InputLabel>
                <Select
                    multiple
                    value={coverageForm.subjects}
                    onChange={(e: SelectChangeEvent<number[]>) => handleChange('subjects', e.target.value)}
                    input={<OutlinedInput label="Subjects in Shot/Audio" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                                const subj = availableSubjects.find(s => s.subject.id === value);
                                return (
                                    <Chip 
                                        key={value} 
                                        label={subj ? `${subj.subject.first_name} (${subj.subject.context_role})` : value} 
                                    />
                                );
                            })}
                        </Box>
                    )}
                >
                    {availableSubjects.map((s) => (
                        <MenuItem key={s.subject.id} value={s.subject.id}>
                            {s.subject.first_name} {s.subject.last_name} ({s.subject.context_role})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
          </Grid>

          {/* VIDEO SPECIFIC FIELDS */}
          {coverageForm.coverage_type === 'VIDEO' && (
            <>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel>Shot Type</InputLabel>
                        <Select
                            value={coverageForm.shot_type || ''}
                            label="Shot Type"
                            onChange={(e) => handleChange('shot_type', e.target.value)}
                        >
                            <MenuItem value="">None</MenuItem>
                            {['WIDE_SHOT', 'MEDIUM_SHOT', 'CLOSE_UP', 'EXTREME_CLOSE_UP', 'OVER_SHOULDER', 'TWO_SHOT', 'ESTABLISHING_SHOT', 'DETAIL_SHOT', 'REACTION_SHOT', 'CUTAWAY', 'INSERT_SHOT', 'MASTER_SHOT'].map(t => (
                                <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel>Movement</InputLabel>
                        <Select
                            value={coverageForm.camera_movement || ''}
                            label="Movement"
                            onChange={(e) => handleChange('camera_movement', e.target.value)}
                        >
                            <MenuItem value="">None</MenuItem>
                            {['STATIC', 'PAN', 'TILT', 'ZOOM', 'TRACKING', 'DOLLY', 'GIMBAL_STABILIZED', 'HANDHELD', 'CRANE', 'DRONE', 'STEADICAM'].map(t => (
                                <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel>Style</InputLabel>
                        <Select
                            value={coverageForm.video_style_type || ''}
                            label="Style"
                            onChange={(e) => handleChange('video_style_type', e.target.value)}
                        >
                            <MenuItem value="">None</MenuItem>
                            {['FULL', 'MONTAGE', 'CINEMATIC'].map(t => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Lens (e.g. 24-70mm)"
                        fullWidth
                        value={coverageForm.lens_focal_length}
                        onChange={(e) => handleChange('lens_focal_length', e.target.value)}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Aperture (e.g. f/2.8)"
                        fullWidth
                        value={coverageForm.aperture}
                        onChange={(e) => handleChange('aperture', e.target.value)}
                    />
                </Grid>
            </>
          )}

          {/* AUDIO SPECIFIC FIELDS */}
          {coverageForm.coverage_type === 'AUDIO' && (
            <>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Audio Equipment</InputLabel>
                        <Select
                            value={coverageForm.audio_equipment || ''}
                            label="Audio Equipment"
                            onChange={(e) => handleChange('audio_equipment', e.target.value)}
                        >
                            <MenuItem value="">None</MenuItem>
                            {['LAPEL_MIC', 'HANDHELD_MIC', 'BOOM_MIC', 'SHOTGUN_MIC', 'AMBIENT_MIC', 'WIRELESS_MIC', 'RECORDER', 'MIXING_BOARD'].map(t => (
                                <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Pattern (e.g. Cardioid)"
                        fullWidth
                        value={coverageForm.audio_pattern}
                        onChange={(e) => handleChange('audio_pattern', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Frequency Response"
                        fullWidth
                        value={coverageForm.frequency_response}
                        onChange={(e) => handleChange('frequency_response', e.target.value)}
                    />
                </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              label="Internal Notes"
              fullWidth
              multiline
              rows={2}
              value={coverageForm.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={creating}>Cancel</Button>
        <Button 
            onClick={onCreate} 
            variant="contained" 
            disabled={!isValid || creating}
            startIcon={creating ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {creating ? 'Creating...' : 'Create Coverage'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
