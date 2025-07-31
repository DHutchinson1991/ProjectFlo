import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemButton } from '@mui/material';
import { DRAWING_TOOLS, Tool } from '../../constants/tools';

interface DrawingToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
    activeTool,
    onToolChange
}) => {
    return (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Drawing Tools
            </Typography>
            <List dense>
                {DRAWING_TOOLS.map((tool) => {
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
    );
};
