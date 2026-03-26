"use client";

import React, { useState } from 'react';
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
  TextField,
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import { colors } from '@/shared/theme/tokens';
import { EmptyState, FormDialog } from '@/shared/ui';
import { useFilmSubjects } from '../hooks/useFilmSubjects';
import type { FilmSubject, SubjectRole } from '../types';

interface SubjectsCardProps {
  filmId: number;
  onSubjectsChange?: (subjects: FilmSubject[]) => void;
}

export const SubjectsCard: React.FC<SubjectsCardProps> = ({
  filmId,
  onSubjectsChange,
}) => {
  const {
    subjects,
    typeTemplates: templates,
    error,
    createSubject,
    deleteSubject,
  } = useFilmSubjects(filmId);

  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SubjectRole | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTemplateSelect = (template: SubjectRole) => {
    setSelectedTemplate(template);
    setSubjectName('');
    setOpenTemplateDialog(false);
    setOpenAddDialog(true);
  };

  const handleAddSubject = async () => {
    if (!selectedTemplate) return;
    try {
      setSubmitting(true);
      const name = subjectName || selectedTemplate.role_name;
      await createSubject({
        name,
        role_template_id: selectedTemplate.id,
      });
      onSubjectsChange?.(subjects);
      setOpenAddDialog(false);
      setSelectedTemplate(null);
      setSubjectName('');
    } catch {
      // error surfaced by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    try {
      await deleteSubject(subjectId);
      onSubjectsChange?.(subjects.filter(s => s.id !== subjectId));
    } catch {
      // error surfaced by hook
    }
  };

  return (
    <Card variant="glass">
      <CardContent sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.text }}>
            Subjects ({subjects.length})
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenTemplateDialog(true)}
            sx={{ textTransform: 'none', color: colors.info }}
          >
            Add
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {subjects.length === 0 ? (
          <EmptyState
            icon={PersonIcon}
            message="No subjects yet"
            description="Add one to get started."
            actionLabel="Add Subject"
            onAction={() => setOpenTemplateDialog(true)}
            sx={{ py: 3 }}
          />
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {subjects.map(subject => (
              <ListItem
                key={subject.id}
                sx={{
                  bgcolor: colors.elevated,
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: colors.card },
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: colors.text, fontWeight: 500 }}>
                    {subject.name}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                    {subject.role && (
                      <Chip
                        label={subject.role.role_name}
                        size="small"
                        variant="status"
                        sx={{
                          bgcolor: subject.role.is_core ? colors.accentSoft : colors.elevated,
                          color: colors.text,
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleDeleteSubject(subject.id)}
                    sx={{ color: colors.error }}
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
                    color: colors.text,
                    borderColor: colors.border,
                    '&:hover': { borderColor: colors.info, bgcolor: colors.card },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {template.role_name}
                    </Typography>
                    {template.description && (
                      <Typography variant="caption" sx={{ color: colors.muted }}>
                        {template.description}
                      </Typography>
                    )}
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

      {/* Add Subject Dialog */}
      <FormDialog
        open={openAddDialog}
        title={`Add Subject from "${selectedTemplate?.role_name ?? ''}"`}
        submitLabel="Add Subject"
        onSubmit={handleAddSubject}
        onCancel={() => setOpenAddDialog(false)}
        submitting={submitting}
        submitDisabled={!subjectName && !selectedTemplate}
      >
        <Typography variant="body2" sx={{ mb: 2, color: colors.muted }}>
          Customize the name or use the default role name.
        </Typography>

        {selectedTemplate && (
          <TextField
            fullWidth
            size="small"
            label="Subject Name"
            placeholder={selectedTemplate.role_name}
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
        )}
      </FormDialog>
    </Card>
  );
};
