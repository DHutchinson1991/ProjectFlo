import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Bolt, ArrowForward } from '@mui/icons-material';
import type { NextActionData } from '../lib';

interface NextBestActionProps {
    nextAction: NextActionData;
    onScrollToSection: (sectionId: string) => void;
}

const NextBestAction: React.FC<NextBestActionProps> = ({ nextAction, onScrollToSection }) => (
    <Box
        onClick={() => onScrollToSection(nextAction.sectionId)}
        sx={{
            mb: 2.5, p: 2, borderRadius: 2.5,
            background: `linear-gradient(135deg, ${nextAction.color}0D, ${nextAction.color}05)`,
            border: `1px solid ${nextAction.color}20`,
            display: 'flex', alignItems: 'center', gap: 2,
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                background: `linear-gradient(135deg, ${nextAction.color}15, ${nextAction.color}08)`,
                border: `1px solid ${nextAction.color}35`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 20px ${nextAction.color}12`,
            },
            '&::before': {
                content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: `linear-gradient(180deg, ${nextAction.color}, ${nextAction.color}60)`,
                borderRadius: '4px 0 0 4px',
            },
        }}
    >
        <Box sx={{
            width: 40, height: 40, borderRadius: 2.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: `${nextAction.color}12`, border: `1px solid ${nextAction.color}18`,
            flexShrink: 0,
        }}>
            <Bolt sx={{ fontSize: 22, color: nextAction.color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: nextAction.color, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.25 }}>
                Recommended Next Action
            </Typography>
            <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>{nextAction.action}</Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 0.25 }}>{nextAction.description}</Typography>
        </Box>
        <Button
            variant="contained" size="small"
            endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            sx={{
                flexShrink: 0, bgcolor: nextAction.color, fontSize: '0.72rem', fontWeight: 700,
                borderRadius: 2, textTransform: 'none', px: 2.5,
                boxShadow: `0 2px 12px ${nextAction.color}25`,
                '&:hover': { bgcolor: nextAction.color, filter: 'brightness(1.15)', boxShadow: `0 4px 20px ${nextAction.color}35` },
            }}
            onClick={(e) => { e.stopPropagation(); onScrollToSection(nextAction.sectionId); }}
        >
            Do it now
        </Button>
    </Box>
);

export { NextBestAction };
