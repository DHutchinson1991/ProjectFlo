"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Stack,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Role {
  id: number;
  role_name: string;
  description?: string;
  is_core: boolean;
}

interface SubjectType {
  id: number;
  name: string;
  description?: string;
  category: string;
  roles: Role[];
}

interface FilmSubject {
  id: number;
  name: string;
  category: string;
  role?: {
    role_name: string;
    is_core: boolean;
  };
}

interface SubjectsCardProps {
  filmId: number;
  brandId: number;
  subjects?: FilmSubject[];
  onSubjectsChange?: (subjects: FilmSubject[]) => void;
}

export const SubjectsCard: React.FC<SubjectsCardProps> = ({
  filmId,
  brandId,
  subjects: initialSubjects = [],
  onSubjectsChange,
}) => {
  const [subjects, setSubjects] = useState<FilmSubject[]>(initialSubjects);
  const [templates, setTemplates] = useState<SubjectType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [openAddSubjectDialog, setOpenAddSubjectDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubjectType | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set());
  const [subjectNames, setSubjectNames] = useState<{ [roleId: number]: string }>({});

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [brandId]);

  // Load subjects
  useEffect(() => {
    loadSubjects();
  }, [filmId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`http://localhost:3002/subjects/roles/brand/${brandId}`);
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch(`http://localhost:3002/subjects/films/${filmId}/subjects`);
      if (!response.ok) throw new Error('Failed to load subjects');
      const data = await response.json();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    }
  };

  const handleTemplateSelect = (template: SubjectType) => {
    setSelectedTemplate(template);
    // Auto-select core roles
    const coreRoleIds = new Set(
      template.roles.filter(r => r.is_core).map(r => r.id)
    );
    setSelectedRoles(coreRoleIds);
    setSubjectNames({});
    setOpenTemplateDialog(false);
    setOpenAddSubjectDialog(true);
  };

  const handleRoleToggle = (roleId: number) => {
    const newSelection = new Set(selectedRoles);
    if (newSelection.has(roleId)) {
      newSelection.delete(roleId);
    } else {
      newSelection.add(roleId);
    }
    setSelectedRoles(newSelection);
  };

  const handleAddSubjects = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      const rolesToAdd = selectedTemplate.roles.filter(r => selectedRoles.has(r.id));

      // Create subjects for each selected role
      const newSubjects: FilmSubject[] = [];
      for (const role of rolesToAdd) {
        const subjectName = subjectNames[role.id] || role.role_name;
        const response = await fetch(`http://localhost:3002/subjects/films/${filmId}/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subjectName,
            category: selectedTemplate.category,
            role_template_id: role.id,
          }),
        });

        if (!response.ok) throw new Error(`Failed to create subject for ${role.role_name}`);
        const newSubject = await response.json();
        newSubjects.push(newSubject);
      }

      const allSubjects = [...subjects, ...newSubjects];
      setSubjects(allSubjects);
      onSubjectsChange?.(allSubjects);

      // Reset dialog
      setOpenAddSubjectDialog(false);
      setSelectedTemplate(null);
      setSelectedRoles(new Set());
      setSubjectNames({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    try {
      const response = await fetch(`http://localhost:3002/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete subject');

      const updatedSubjects = subjects.filter(s => s.id !== subjectId);
      setSubjects(updatedSubjects);
      onSubjectsChange?.(updatedSubjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
    }
  };

  return (
    <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
      <CardContent sx={{ padding: '12px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
            Subjects ({subjects.length})
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenTemplateDialog(true)}
            sx={{ textTransform: 'none', color: '#4a9eff' }}
          >
            Add
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {subjects.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
            No subjects yet. Add one to get started.
          </Typography>
        ) : (
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {subjects.map(subject => (
              <ListItem
                key={subject.id}
                sx={{
                  bgcolor: '#242424',
                  mb: 1,
                  borderRadius: '4px',
                  '&:hover': { bgcolor: '#2a2a2a' },
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                    {subject.name}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                    {subject.role && (
                      <Chip
                        label={subject.role.role_name}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '0.7rem',
                          bgcolor: subject.role.is_core ? '#4a148c' : '#424242',
                          color: '#fff',
                        }}
                      />
                    )}
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {subject.category}
                    </Typography>
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleDeleteSubject(subject.id)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      {/* Template Selection Dialog */}
      <Dialog open={openTemplateDialog} onClose={() => setOpenTemplateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Subject Type Template</DialogTitle>
        <DialogContent>
          {templates.length === 0 ? (
            <Alert severity="info">No templates created yet for this brand.</Alert>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {templates.map(template => (
                <Button
                  key={template.id}
                  variant="outlined"
                  onClick={() => handleTemplateSelect(template)}
                  fullWidth
                  sx={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    py: 1.5,
                    color: '#fff',
                    borderColor: '#333',
                    '&:hover': { borderColor: '#4a9eff', bgcolor: '#1a1a1a' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {template.name}
                    </Typography>
                    {template.description && (
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        {template.description}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.5 }}>
                      {template.roles.length} roles
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplateDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Add Subjects Dialog */}
      <Dialog open={openAddSubjectDialog} onClose={() => setOpenAddSubjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Subjects from "{selectedTemplate?.name}"</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#999' }}>
            Core roles are pre-selected. Choose additional roles or customize names.
          </Typography>

          {selectedTemplate && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {selectedTemplate.roles.map(role => (
                <Box key={role.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Checkbox
                      checked={selectedRoles.has(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                    />
                    <Typography sx={{ flex: 1, fontWeight: role.is_core ? 600 : 400 }}>
                      {role.role_name}
                      {role.is_core && <Chip label="CORE" size="small" sx={{ ml: 1, height: '18px' }} />}
                    </Typography>
                  </Box>

                  {selectedRoles.has(role.id) && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Enter name for ${role.role_name}...`}
                      value={subjectNames[role.id] || ''}
                      onChange={(e) =>
                        setSubjectNames(prev => ({
                          ...prev,
                          [role.id]: e.target.value,
                        }))
                      }
                      sx={{ ml: 4, mb: 1 }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddSubjectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddSubjects}
            variant="contained"
            disabled={loading || selectedRoles.size === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Add Subjects'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
