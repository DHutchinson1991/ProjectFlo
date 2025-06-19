// packages/frontend/src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/AuthProvider';
import { Box, CircularProgress } from '@mui/material';

// This is a temporary landing page that redirects users based on auth state.
export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/app'); // If logged in, go to the dashboard
      } else {
        router.push('/login'); // If not logged in, go to the login page
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show a loading spinner while we determine where to send the user
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}