import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemButton, Divider } from '@mui/material';
import { FURNITURE_ELEMENTS, OUTDOOR_ELEMENTS, EQUIPMENT_ELEMENTS, Tool } from '../../constants/tools';

interface FurnitureToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}

export const FurnitureToolbar: React.FC<FurnitureToolbarProps> = ({
    activeTool,
    onToolChange
}) => {
    return (
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            {/* Furniture Elements */}
            <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Furniture & Seating
                </Typography>
                <List dense>
                    {FURNITURE_ELEMENTS.map((tool) => {
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

            {/* Outdoor Elements */}
            <Box sx={{ p: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Outdoor Elements
                </Typography>
                <List dense>
                    {OUTDOOR_ELEMENTS.map((tool) => {
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

            {/* Equipment Elements */}
            <Box sx={{ p: 2, pt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Equipment
                </Typography>
                <List dense>
                    {EQUIPMENT_ELEMENTS.map((tool) => {
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
