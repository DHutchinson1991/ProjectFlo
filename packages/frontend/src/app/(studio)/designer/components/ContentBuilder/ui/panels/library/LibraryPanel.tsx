"use client";

import React from 'react';
import { Box } from '@mui/material';
import { useContentBuilder } from '../../../context/ContentBuilderContext';
import { ScenesBrowser } from './'

/**
 * Library Panel Container
 * 
 * Left sidebar panel that displays the component library.
 */
export const LibraryPanel: React.FC = () => {
  // ✅ USE SHARED CONTEXT
  const {
    getFilteredScenes,
    handleSceneFromLibrary,
    readOnly,
  } = useContentBuilder();

  const availableScenes = getFilteredScenes() as any[];

  return (
    <Box sx={{
      width: "280px",
      borderRight: "1px solid #333",
      backgroundColor: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      '@media (max-width: 1200px)': {
        width: '100%',
        borderRight: 'none',
        borderBottom: '1px solid #333'
      }
    }}>
      <ScenesBrowser
        scenes={availableScenes}
        onSceneSelect={handleSceneFromLibrary}
        readOnly={readOnly}
      />
    </Box>
  );
};
