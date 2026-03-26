"use client";

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Camera as EquipmentIcon,
  People as CrewIcon,
  Videocam as VideoIcon,
  Mic as AudioIcon,
} from '@mui/icons-material';

interface Equipment {
  id: number;
  name: string;
  category: string;
  type: string;
  model?: string;
}

interface CrewMember {
  id: number;
  name: string;
  role: string;
  assignment?: string;
}

interface CrewEquipmentPanelProps {
  equipment?: Equipment[];
  crew?: CrewMember[];
  loading?: boolean;
}

const CrewEquipmentPanel: React.FC<CrewEquipmentPanelProps> = ({
  equipment = [],
  crew = [],
  loading = false,
}) => {
  const getEquipmentIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'camera':
      case 'video':
        return <VideoIcon />;
      case 'audio':
        return <AudioIcon />;
      default:
        return <EquipmentIcon />;
    }
  };

  const getEquipmentColor = (category: string): 'default' | 'primary' | 'secondary' => {
    switch (category.toLowerCase()) {
      case 'camera':
      case 'video':
        return 'primary';
      case 'audio':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Equipment Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EquipmentIcon sx={{ color: 'info.main', mr: 1 }} />
            <Typography variant="h6">Equipment</Typography>
          </Box>

          {equipment.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {equipment.map((item) => (
                <Chip
                  key={item.id}
                  icon={getEquipmentIcon(item.category)}
                  label={`${item.name} ${item.model ? `(${item.model})` : ''}`}
                  color={getEquipmentColor(item.category)}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          ) : (
            <Paper
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No equipment assigned
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Crew Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CrewIcon sx={{ color: 'warning.main', mr: 1 }} />
            <Typography variant="h6">Crew Assignments</Typography>
          </Box>

          {crew.length > 0 ? (
            <List dense>
              {crew.map((member) => (
                <ListItem key={member.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {member.role}
                        </Typography>
                        {member.assignment && (
                          <Chip
                            label={member.assignment}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Paper
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No crew assignments
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CrewEquipmentPanel;
