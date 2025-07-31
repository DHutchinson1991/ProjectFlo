import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemButton, Divider } from '@mui/material';
import { VENUE_STRUCTURE, VENUE_AMENITIES, Tool } from '../../constants/tools';

interface VenueToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}

export const VenueToolbar: React.FC<VenueToolbarProps> = ({
    activeTool,
    onToolChange
}) => {
    return (
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            {/* Venue Structure */}
            <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Venue Structure
                </Typography>
                <List dense>
                    {VENUE_STRUCTURE.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                            <ListItem key={tool.id} disablePadding>
                                <ListItemButton
                                    selected={activeTool === tool.id}
                                    onClick={() => onToolChange(tool.id)}
                                    sx={{
                                        minHeight: 36,
                                        borderRadius: 1,
                                        mb: 0.5
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {React.createElement(IconComponent)}
                                    </ListItemIcon>
                                    <Typography variant="body2">{tool.label}</Typography>
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Divider />

            {/* Venue Amenities */}
            <Box sx={{ p: 2, pt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Venue Amenities
                </Typography>
                <List dense>
                    {VENUE_AMENITIES.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                            <ListItem key={tool.id} disablePadding>
                                <ListItemButton
                                    selected={activeTool === tool.id}
                                    onClick={() => onToolChange(tool.id)}
                                    sx={{
                                        minHeight: 36,
                                        borderRadius: 1,
                                        mb: 0.5
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {React.createElement(IconComponent)}
                                    </ListItemIcon>
                                    <Typography variant="body2">{tool.label}</Typography>
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </Box>
    );
};
