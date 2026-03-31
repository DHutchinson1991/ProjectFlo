'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Collapse } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChatBubbleOutline, Check, Close, EditOutlined } from '@mui/icons-material';
import type { PortalThemeColors } from '@/features/workflow/proposals/utils/portal/themes';
import type { ProposalSectionNote } from '@/features/workflow/proposals/types';

interface SectionNoteInputProps {
  sectionType: string;
  sectionLabel?: string;
  colors: PortalThemeColors;
  existingNote?: ProposalSectionNote;
  onSave: (sectionType: string, note: string) => void;
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SectionNoteInput({
  sectionType,
  sectionLabel,
  colors,
  existingNote,
  onSave,
}: SectionNoteInputProps) {
  const hasExisting = !!existingNote?.note;
  const [open, setOpen] = useState(hasExisting);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSave(sectionType, trimmed);
    setEditing(false);
    setDraft('');
  }, [draft, sectionType, onSave]);

  const handleDiscard = useCallback(() => {
    setDraft('');
    if (!hasExisting) {
      setEditing(false);
      setOpen(false);
    } else {
      setEditing(false);
    }
  }, [hasExisting]);

  const handleStartEdit = useCallback(() => {
    setDraft(existingNote?.note ?? '');
    setEditing(true);
  }, [existingNote]);

  const handleStartNew = useCallback(() => {
    setDraft('');
    setEditing(true);
  }, []);

  const isDark = colors.bg === '#09090b' || colors.bg === '#0a0a0a';
  const label = sectionLabel || sectionType;
  const wasEdited = existingNote && existingNote.updated_at !== existingNote.created_at;
  const timestamp = existingNote ? (wasEdited ? existingNote.updated_at : existingNote.created_at) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Tab fused to card bottom — always visible */}
      <Box
        className="note-tab"
        onClick={() => {
          if (!open) { setOpen(true); if (!hasExisting) setEditing(true); }
          else if (!editing) { handleStartEdit(); }
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.6,
          cursor: 'pointer',
          px: 1.5,
          py: 0.4,
          mt: -0.25,
          borderRadius: '0 0 8px 8px',
          bgcolor: alpha(isDark ? colors.card : colors.border, isDark ? 0.4 : 0.1),
          border: `1px solid ${alpha(colors.border, 0.3)}`,
          borderTop: 'none',
          color: alpha(colors.muted, 0.35),
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            color: colors.accent,
            bgcolor: alpha(colors.accent, 0.1),
            borderColor: alpha(colors.accent, 0.25),
          },
          '.section-group:hover &': {
            color: alpha(colors.muted, 0.6),
            bgcolor: alpha(isDark ? colors.card : colors.border, isDark ? 0.55 : 0.18),
            borderColor: alpha(colors.border, 0.5),
          },
          '.section-group:hover &:hover': {
            color: colors.accent,
            bgcolor: alpha(colors.accent, 0.1),
            borderColor: alpha(colors.accent, 0.25),
          },
        }}
      >
        <ChatBubbleOutline sx={{ fontSize: 12 }} />
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: 0.3 }}>
          {hasExisting && !editing ? 'Update note' : 'Add note'}
        </Typography>
      </Box>

      {/* Expanded panel — subtle bg + left accent border, not a card */}
      <Collapse in={open} sx={{ width: '100%' }}>
        <Box
          sx={{
            mt: 1,
            ml: { xs: 1, md: 2 },
            pl: { xs: 1.5, md: 2 },
            pr: { xs: 1, md: 1.5 },
            py: 1.2,
            borderLeft: `2px solid ${alpha(colors.accent, 0.2)}`,
            bgcolor: alpha(isDark ? colors.card : '#000', isDark ? 0.2 : 0.02),
            borderRadius: '0 8px 8px 0',
          }}
        >
          {/* Section label */}
          <Typography sx={{
            color: alpha(colors.muted, 0.4),
            fontSize: '0.58rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            mb: 0.6,
          }}>
            Notes on {label}
          </Typography>

          {/* Existing note display */}
          {hasExisting && !editing && (
            <Box>
              <Typography
                sx={{
                  color: colors.text,
                  fontSize: '0.82rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {existingNote.note}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4 }}>
                {timestamp && (
                  <Typography sx={{ color: alpha(colors.muted, 0.35), fontSize: '0.6rem' }}>
                    {wasEdited ? 'Edited ' : ''}{formatNoteDate(timestamp)}
                  </Typography>
                )}
                <Typography sx={{ color: alpha(colors.muted, 0.2), fontSize: '0.6rem' }}>·</Typography>
                <Typography
                  component="span"
                  onClick={handleStartEdit}
                  sx={{
                    color: alpha(colors.muted, 0.4),
                    fontSize: '0.6rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    '&:hover': { color: colors.accent },
                    transition: 'color 0.2s',
                  }}
                >
                  <EditOutlined sx={{ fontSize: 10 }} />
                  Update
                </Typography>
              </Box>
            </Box>
          )}

          {/* Editor — for new note or editing existing */}
          {editing && (
            <Box>
              <TextField
                inputRef={inputRef}
                multiline
                minRows={2}
                maxRows={4}
                fullWidth
                placeholder={hasExisting && !draft ? 'Update your note…' : `Add a note about ${label}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    color: colors.text,
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                    '& textarea::placeholder': { color: colors.muted, opacity: 0.5 },
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.3 }}>
                <IconButton
                  size="small"
                  onClick={handleDiscard}
                  sx={{ color: colors.muted, '&:hover': { color: colors.text } }}
                >
                  <Close sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleSave}
                  disabled={!draft.trim()}
                  sx={{
                    color: colors.accent,
                    '&:hover': { bgcolor: alpha(colors.accent, 0.1) },
                    '&.Mui-disabled': { color: alpha(colors.muted, 0.3) },
                  }}
                >
                  <Check sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
