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
  Videocam as VideocamIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface VideoCoverageTableProps {
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
    backgroundColor: isDragging ? 'rgba(3, 169, 244, 0.1)' : 'inherit',
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
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem', 
                    mr: 1,
                    bgcolor: 'primary.main',
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
        {item.shot_type ? (
          <Chip label={item.shot_type.replace('_', ' ')} size="small" variant="outlined" />
        ) : '-'}
      </TableCell>
      <TableCell>{item.camera_movement ? item.camera_movement.replace('_', ' ') : '-'}</TableCell>
      <TableCell>{item.lens_focal_length || '-'}</TableCell>
      <TableCell>
        {item.job_role?.name || item.operator || 'Unassigned'}
      </TableCell>
      <TableCell>
        <Chip 
          label={`${item.assignmentCount || 0} moment${(item.assignmentCount || 0) !== 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
          color={(item.assignmentCount || 0) > 0 ? 'primary' : 'default'}
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

export default function VideoCoverageTable({
  coverageItems,
  availableSubjects,
  onAddCoverage,
  onEditCoverage,
  onRemoveCoverage
}: VideoCoverageTableProps) {
  // Filter for VIDEO type only
  const videoItems = (coverageItems || []).filter((i: any) => i.coverage_type === 'VIDEO');

  // Deduplicate items by assignment_number and group assignments
  const deduplicatedItems = videoItems.reduce((acc: any[], item: any) => {
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
      const initialCount = isAssigned ? 1 : 0;
      acc.push({ ...item, assignmentCount: initialCount, allIds: [item.id] });
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
          <VideocamIcon color="primary" />
          <Typography variant="h6" component="div">
            Video Coverage
          </Typography>
          <Chip label={`${deduplicatedItems.length} items`} size="small" />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddCoverage}
          size="small"
        >
          Add Video
        </Button>
      </Box>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Shot Type</TableCell>
              <TableCell>Movement</TableCell>
              <TableCell>Lens</TableCell>
              <TableCell>Job Role</TableCell>
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
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No video coverage items added yet. Click "Add Video" to start.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
