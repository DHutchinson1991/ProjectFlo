"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Mic as MicIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface AudioCoverageTableProps {
  coverageItems: any[];
  availableSubjects?: any[];
  onAddCoverage: () => void;
  onEditCoverage: (item: any) => void;
  onRemoveCoverage: (id: number) => void;
}

// Draggable Row Component
const DraggableRow = ({ item, onEdit, onRemove }: { item: any; onEdit: (i:any)=>void; onRemove: (id:number)=>void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `coverage-${item.id}`,
    data: {
      type: 'coverage',
      item: item
    }
  });

  const style = {
    // We don't apply transform here because we want the row to stay in the table
    // and use DragOverlay in the parent for the visual drag representation
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    backgroundColor: isDragging ? 'rgba(76, 175, 80, 0.1)' : 'inherit',
  };

  // Helper function to clean the name (remove random suffix like "(h54rzg)")
  const cleanName = (name: string) => {
    if (!name) return '';
    // Remove pattern like " (h54rzg)" or " (abc123)" - 6 alphanumeric characters in parentheses
    return name.replace(/\s*\([a-z0-9]{6}\)\s*$/i, '').trim();
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      hover
    >
      <TableCell component="th" scope="row">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIcon sx={{ color: 'text.disabled', fontSize: 16, cursor: 'grab' }} />
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {item.assignment_number ? (
                <Chip 
                  label={item.assignment_number} 
                  size="small" 
                  color="success"
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem', 
                    mr: 1,
                    color: 'white'
                  }} 
                />
              ) : null}
              {cleanName(item.name)}
            </Typography>
            {item.description && (
              <Typography variant="caption" color="text.secondary" display="block">
                {item.description}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        {item.audio_equipment ? (
          <Chip label={item.audio_equipment.replace('_', ' ')} size="small" variant="outlined" />
        ) : '-'}
      </TableCell>
      <TableCell>{item.audio_pattern || '-'}</TableCell>
      <TableCell>{item.operator || 'Unassigned'}</TableCell>
      <TableCell>
        <Chip 
          label={`${item.assignmentCount || 0} moment${(item.assignmentCount || 0) !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          color={(item.assignmentCount || 0) > 0 ? 'secondary' : 'default'}
        />
      </TableCell>
      <TableCell align="right">
         {/* Use onPointerDown to prevent dragging when clicking buttons */}
         <Box onPointerDown={(e) => e.stopPropagation()}>
            <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(item)}>
                    <EditIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onRemove(item.id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default function AudioCoverageTable({
  coverageItems,
  availableSubjects,
  onAddCoverage,
  onEditCoverage,
  onRemoveCoverage
}: AudioCoverageTableProps) {
  // Filter for AUDIO type only
  const audioItems = coverageItems?.filter((i: any) => i.coverage_type === 'AUDIO') || [];

  // Deduplicate items by assignment_number and group assignments
  const deduplicatedItems = audioItems.reduce((acc: any[], item: any) => {
    const existingIndex = acc.findIndex(
      (existing) => existing.assignment_number === item.assignment_number
    );

    // Check if this item is essentially an assigned instance (has moment_id)
    const isAssigned = item.moment_id != null;
    
    if (existingIndex >= 0) {
      // Item already exists.
      // If the NEW item is assigned, increment count.
      if (isAssigned) {
         acc[existingIndex].assignmentCount = (acc[existingIndex].assignmentCount || 0) + 1;
      }
      
      // Keep track of all IDs for editing
      acc[existingIndex].allIds = [...(acc[existingIndex].allIds || [acc[existingIndex].id]), item.id];
    } else {
      // New item
      // Initial count is 1 if it is assigned, 0 if it is the definition (moment_id=null)
      const assignmentCount = isAssigned ? 1 : 0;
      acc.push({ ...item, assignmentCount, allIds: [item.id] });
    }
    
    return acc;
  }, []);

  return (
    <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden' }}>
      {/* Header Toolbar */}
      <Box sx={{
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(224, 224, 224, 1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MicIcon color="secondary" />
          <Typography variant="h6" component="div">
            Audio Coverage
          </Typography>
          <Chip label={`${deduplicatedItems.length} items`} size="small" />
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={onAddCoverage}
          size="small"
        >
          Add Audio
        </Button>
      </Box>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Pattern</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Assignments</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deduplicatedItems.length > 0 ? (
              deduplicatedItems.map((item: any) => (
                <DraggableRow 
                    key={item.id} 
                    item={item} 
                    onEdit={onEditCoverage} 
                    onRemove={onRemoveCoverage}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No audio coverage items assigned yet.
                  </Typography>
                  <Button size="small" color="secondary" startIcon={<AddIcon />} onClick={onAddCoverage} sx={{ mt: 1 }}>
                    Create First Assignments
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
