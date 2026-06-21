"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useContentBuilder } from '../../context/ContentBuilderContext';
import { INSPECTOR_PANEL_SX } from '../inspector/recordingSetupInspectorShared';
import { ScenePanel } from '../scene/ScenePanel';
import { MomentPanel } from '../moment/MomentPanel';

const tabSx = (active: boolean) => ({
  flex: 1,
  py: 1,
  px: 1.5,
  cursor: 'pointer',
  textAlign: 'center' as const,
  borderBottom: active ? '2px solid #7B61FF' : '2px solid transparent',
  bgcolor: active ? 'rgba(123, 97, 255, 0.08)' : 'transparent',
  transition: 'all 0.15s ease',
  '&:hover': { bgcolor: active ? 'rgba(123, 97, 255, 0.08)' : 'rgba(255,255,255,0.03)' },
});

const tabLabelSx = (active: boolean) => ({
  fontSize: '0.68rem',
  fontWeight: active ? 700 : 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
});

/**
 * Tabbed right inspector — Scene-level vs Moment-level editing.
 */
export const InspectorPanel: React.FC = () => {
  const {
    inspectorTab,
    setInspectorTab,
    currentScene,
    currentMoment,
    aiBlockingPending,
  } = useContentBuilder();

  const sceneAvailable = !!currentScene;
  const momentAvailable = !!currentMoment;

  React.useEffect(() => {
    if (inspectorTab === 'moment' && !momentAvailable && sceneAvailable) {
      setInspectorTab('scene');
    } else if (inspectorTab === 'scene' && !sceneAvailable && momentAvailable) {
      setInspectorTab('moment');
    }
  }, [inspectorTab, momentAvailable, sceneAvailable, setInspectorTab]);

  return (
    <Box sx={INSPECTOR_PANEL_SX}>
      <Box sx={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        bgcolor: '#111',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex' }}>
          <Box
            sx={tabSx(inspectorTab === 'scene')}
            onClick={() => sceneAvailable && setInspectorTab('scene')}
            role="tab"
            aria-selected={inspectorTab === 'scene'}
          >
            <Typography sx={tabLabelSx(inspectorTab === 'scene')}>Scene</Typography>
          </Box>
          <Box
            sx={tabSx(inspectorTab === 'moment')}
            onClick={() => momentAvailable && setInspectorTab('moment')}
            role="tab"
            aria-selected={inspectorTab === 'moment'}
          >
            <Typography sx={tabLabelSx(inspectorTab === 'moment')}>Moment</Typography>
          </Box>
        </Box>
        {aiBlockingPending && (
          <Typography sx={{
            px: 2, py: 0.5, fontSize: '0.65rem',
            color: 'rgba(179,136,255,0.65)', bgcolor: 'rgba(179,136,255,0.06)',
            borderTop: '1px solid rgba(179,136,255,0.1)',
          }}>
            AI blocking in progress…
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {inspectorTab === 'scene' ? <ScenePanel /> : <MomentPanel embedded />}
      </Box>
    </Box>
  );
};

export default InspectorPanel;
