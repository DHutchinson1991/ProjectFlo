'use client';

import React from 'react';
import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import TableBarRoundedIcon from '@mui/icons-material/TableBarRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import SquareRoundedIcon from '@mui/icons-material/SquareRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import WindowRoundedIcon from '@mui/icons-material/WindowRounded';
import ChairRoundedIcon from '@mui/icons-material/ChairRounded';
import TheaterComedyRoundedIcon from '@mui/icons-material/TheaterComedyRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import LocalBarRoundedIcon from '@mui/icons-material/LocalBarRounded';
import NightlifeRoundedIcon from '@mui/icons-material/NightlifeRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import ChurchRoundedIcon from '@mui/icons-material/ChurchRounded';
import type { FloorPlanObjectType } from '../../../../types/floor-plan.types';

interface ToolbarItem {
    type: FloorPlanObjectType;
    label: string;
    icon: React.ReactNode;
}

const STRUCTURAL: ToolbarItem[] = [
    { type: 'WALL', label: 'Wall', icon: <SquareRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'DOOR', label: 'Door', icon: <MeetingRoomRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'WINDOW', label: 'Window', icon: <WindowRoundedIcon sx={{ fontSize: 18 }} /> },
];

const FURNITURE_ITEMS: ToolbarItem[] = [
    { type: 'TABLE_ROUND', label: 'Round Table', icon: <TableBarRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'TABLE_RECT', label: 'Rect Table', icon: <TableRestaurantRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'TABLE_HEAD', label: 'Head Table', icon: <TableRestaurantRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'CHAIR_ROW', label: 'Chair Row', icon: <ChairRoundedIcon sx={{ fontSize: 18 }} /> },
];

const VENUE_FEATURES: ToolbarItem[] = [
    { type: 'STAGE', label: 'Stage', icon: <TheaterComedyRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'ALTAR', label: 'Altar', icon: <ChurchRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'DANCE_FLOOR', label: 'Dance Floor', icon: <NightlifeRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'BAR', label: 'Bar', icon: <LocalBarRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'DJ_BOOTH', label: 'DJ Booth', icon: <MusicNoteRoundedIcon sx={{ fontSize: 18 }} /> },
];

const UTILITIES: ToolbarItem[] = [
    { type: 'AISLE', label: 'Aisle', icon: <SquareRoundedIcon sx={{ fontSize: 18 }} /> },
    { type: 'LABEL', label: 'Label', icon: <LabelRoundedIcon sx={{ fontSize: 18 }} /> },
];

interface ObjectToolbarProps {
    activeTool: FloorPlanObjectType | null;
    onSelectTool: (type: FloorPlanObjectType | null) => void;
    disabled?: boolean;
}

export const ObjectToolbar: React.FC<ObjectToolbarProps> = ({
    activeTool,
    onSelectTool,
    disabled = false,
}) => {
    const renderGroup = (items: ToolbarItem[]) =>
        items.map((item) => (
            <Tooltip key={item.type} title={item.label} placement="top" arrow>
                <span>
                    <IconButton
                        size="small"
                        disabled={disabled}
                        onClick={() =>
                            onSelectTool(activeTool === item.type ? null : item.type)
                        }
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            color:
                                activeTool === item.type
                                    ? '#7B61FF'
                                    : 'rgba(255,255,255,0.5)',
                            bgcolor:
                                activeTool === item.type
                                    ? 'rgba(123,97,255,0.15)'
                                    : 'transparent',
                            border:
                                activeTool === item.type
                                    ? '1px solid rgba(123,97,255,0.4)'
                                    : '1px solid transparent',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.06)',
                            },
                        }}
                    >
                        {item.icon}
                    </IconButton>
                </span>
            </Tooltip>
        ));

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                px: 1,
                py: 0.5,
                bgcolor: 'rgba(0,0,0,0.4)',
                borderRadius: 1.5,
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {renderGroup(STRUCTURAL)}
            <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}
            />
            {renderGroup(FURNITURE_ITEMS)}
            <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}
            />
            {renderGroup(VENUE_FEATURES)}
            <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}
            />
            {renderGroup(UTILITIES)}
        </Box>
    );
};
