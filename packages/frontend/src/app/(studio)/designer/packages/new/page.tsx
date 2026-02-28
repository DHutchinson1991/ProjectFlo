'use client';

import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/app/providers/BrandProvider';
import { api } from '@/lib/api';
import WeddingTypeSelector from '../components/WeddingTypeSelector';

export default function NewPackagePage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePackageCreated = async (packageId: number) => {
        setIsLoading(true);
        try {
            // Redirect to the newly created package detail page
            router.push(`/designer/packages/${packageId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to navigate to package');
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            p: 3,
            minHeight: '100vh',
            bgcolor: '#0f1419',
        }}>
            {/* Header */}
            <Box>
                <Typography variant="h4" sx={{ 
                    color: '#ffffff', 
                    fontWeight: 700, 
                    mb: 1 
                }}>
                    Create Package
                </Typography>
                <Typography sx={{ 
                    color: '#94a3b8', 
                    fontSize: '0.95rem' 
                }}>
                    Choose a wedding type template to quickly auto-populate package details
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Loading Spinner */}
            {isLoading && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                }}>
                    <CircularProgress sx={{ color: '#f59e0b' }} />
                </Box>
            )}

            {/* Wedding Type Selector */}
            {!isLoading && (
                <WeddingTypeSelector 
                    onPackageCreated={handlePackageCreated}
                    isLoading={isLoading}
                />
            )}
        </Box>
    );
}
