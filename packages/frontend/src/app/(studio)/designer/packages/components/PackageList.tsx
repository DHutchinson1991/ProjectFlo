'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useBrand } from '@/app/providers/BrandProvider';
import { api } from '@/lib/api';

interface ServicePackage {
  id: number;
  name: string;
  description?: string;
  service_type?: string;
}

export default function PackageList() {
  const { currentBrand } = useBrand();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, [currentBrand?.id]);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentBrand?.id) {
        setError('Brand context not available');
        setLoading(false);
        return;
      }
      // TODO: Replace with actual API call when packages endpoint is available
      // const response = await api.packages.getAll(currentBrand.id);
      // setPackages(response);
      
      // For now, show empty state
      setPackages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#f59e0b' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>
        Your Packages
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {packages.length === 0 ? (
        <Card sx={{
          bgcolor: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 2,
        }}>
          <CardContent sx={{
            textAlign: 'center',
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '1rem' }}>
              No packages yet. Create your first package to get started!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#f59e0b',
                color: '#000',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#d97706',
                },
              }}
            >
              Create Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {packages.map((pkg) => (
            <Grid item xs={12} sm={6} md={4} key={pkg.id}>
              <Card sx={{
                bgcolor: '#1e293b',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  bgcolor: '#0f1419',
                },
              }}>
                <CardContent>
                  <Typography sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
                    {pkg.name}
                  </Typography>
                  {pkg.description && (
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {pkg.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}