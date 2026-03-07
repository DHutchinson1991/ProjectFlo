'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CakeIcon from '@mui/icons-material/Cake';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EventIcon from '@mui/icons-material/Event';

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

interface ServiceTypeSelectorProps {
  onServiceTypeSelected: (serviceType: ServiceType) => void;
}

const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Complete wedding photography and videography packages',
    icon: <FavoriteIcon sx={{ fontSize: 48 }} />,
    color: '#f59e0b',
    available: true,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Birthday party photography and celebration coverage',
    icon: <CakeIcon sx={{ fontSize: 48 }} />,
    color: '#ec4899',
    available: false, // Coming soon
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'Engagement session and couple photography',
    icon: <CelebrationIcon sx={{ fontSize: 48 }} />,
    color: '#8b5cf6',
    available: false, // Coming soon
  },
  {
    id: 'corporate',
    name: 'Corporate Event',
    description: 'Corporate events, conferences, and team building',
    icon: <EventIcon sx={{ fontSize: 48 }} />,
    color: '#06b6d4',
    available: false, // Coming soon
  },
];

export default function ServiceTypeSelector({ onServiceTypeSelected }: ServiceTypeSelectorProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

  const handleServiceTypeClick = (serviceType: ServiceType) => {
    if (!serviceType.available) return;
    setSelectedServiceType(serviceType);
  };

  const handleContinue = () => {
    if (selectedServiceType) {
      onServiceTypeSelected(selectedServiceType);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#ffffff' }}>
        What type of service are you creating a package for?
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {SERVICE_TYPES.map((serviceType) => (
          <Grid item xs={12} sm={6} md={3} key={serviceType.id}>
            <Card
              onClick={() => handleServiceTypeClick(serviceType)}
              sx={{
                cursor: serviceType.available ? 'pointer' : 'not-allowed',
                border: selectedServiceType?.id === serviceType.id
                  ? `2px solid ${serviceType.color}`
                  : '2px solid transparent',
                bgcolor: selectedServiceType?.id === serviceType.id
                  ? 'rgba(245, 158, 11, 0.1)'
                  : '#1e293b',
                opacity: serviceType.available ? 1 : 0.6,
                transition: 'all 0.2s ease-in-out',
                '&:hover': serviceType.available ? {
                  borderColor: serviceType.color,
                  bgcolor: 'rgba(245, 158, 11, 0.05)',
                } : {},
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: serviceType.color, mb: 2 }}>
                  {serviceType.icon}
                </Box>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1, fontWeight: 600 }}>
                  {serviceType.name}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mb: 2 }}>
                  {serviceType.description}
                </Typography>
                {!serviceType.available && (
                  <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    Coming Soon
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!selectedServiceType}
          sx={{
            bgcolor: selectedServiceType?.color || '#f59e0b',
            '&:hover': {
              bgcolor: selectedServiceType?.color || '#f59e0b',
              opacity: 0.9,
            },
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Continue with {selectedServiceType?.name || 'Selected Service'}
        </Button>
      </Box>
    </Box>
  );
}