'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Chip,
    IconButton,
    Paper,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ContentCopy as ContentCopyIcon,
    DragIndicator as DragIndicatorIcon,
    AccessTime as AccessTimeIcon,
    AttachMoney as AttachMoneyIcon,
    Videocam as VideocamIcon,
    Layers as LayersIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { ComponentLibrary } from '../_shared/types';

// Types
interface TemplateComponent {
    id: string;
    componentId: string;
    order: number;
    duration?: number;
    customSettings?: Record<string, unknown>;
    component?: ComponentLibrary;
}

interface DeliverableTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    components: TemplateComponent[];
    totalDuration: number;
    estimatedCost: number;
    complexity: number;
}

interface VisualDeliverableBuilderProps {
    template: DeliverableTemplate;
    onTemplateChange: (template: DeliverableTemplate) => void;
    availableComponents?: ComponentLibrary[];
    showComponentLibrary?: boolean;
    compact?: boolean;
}

// Mock data - replace with actual API calls
const mockComponents: ComponentLibrary[] = [
    {
        id: 1,
        name: 'Opening Sequence',
        description: 'Professional opening with titles and music',
        type: 'PRODUCTION',
        complexity_score: 4,
        estimated_duration: 15,
        default_editing_style: 'cinematic',
        base_task_hours: '2.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Ceremony Highlights',
        description: 'Key moments from the ceremony',
        type: 'COVERAGE_BASED',
        complexity_score: 5,
        estimated_duration: 30,
        default_editing_style: 'documentary',
        base_task_hours: '3.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Reception Dancing',
        description: 'Dance floor and reception activities',
        type: 'COVERAGE_BASED',
        complexity_score: 4,
        estimated_duration: 20,
        default_editing_style: 'energetic',
        base_task_hours: '2.5',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Couple Portraits',
        description: 'Romantic couple shots and portraits',
        type: 'PRODUCTION',
        complexity_score: 3,
        estimated_duration: 10,
        default_editing_style: 'romantic',
        base_task_hours: '1.5',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Family Moments',
        description: 'Special family interactions and group shots',
        type: 'COVERAGE_BASED',
        complexity_score: 3,
        estimated_duration: 12,
        default_editing_style: 'warm',
        base_task_hours: '1.8',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 6,
        name: 'Closing Credits',
        description: 'Thank you message and final credits',
        type: 'PRODUCTION',
        complexity_score: 2,
        estimated_duration: 5,
        default_editing_style: 'elegant',
        base_task_hours: '1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

const componentCategories = [
    'All',
    'Introduction',
    'Main Content',
    'Reception',
    'Effects',
    'Post-Production',
    'Audio'
];

export default function VisualDeliverableBuilder({
    template,
    onTemplateChange,
    availableComponents = mockComponents,
    showComponentLibrary = true,
    compact = false
}: VisualDeliverableBuilderProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        // Handle drag between different droppables
        if (source.droppableId === 'component-library' && destination.droppableId === 'template-components') {
            // Add component to template
            const component = availableComponents.find(c => c.id.toString() === draggableId);
            if (!component) return;

            const newTemplateComponent: TemplateComponent = {
                id: `tc-${Date.now()}`,
                componentId: draggableId,
                order: destination.index,
                duration: component.estimated_duration,
                component: component
            };

            const newComponents = [...template.components];
            newComponents.splice(destination.index, 0, newTemplateComponent);

            // Update order
            newComponents.forEach((comp, index) => {
                comp.order = index;
            });

            onTemplateChange({
                ...template,
                components: newComponents
            });
        } else if (source.droppableId === 'template-components' && destination.droppableId === 'template-components') {
            // Reorder template components
            if (source.index === destination.index) return;

            const newComponents = [...template.components];
            const [reorderedItem] = newComponents.splice(source.index, 1);
            newComponents.splice(destination.index, 0, reorderedItem);

            // Update order
            newComponents.forEach((comp, index) => {
                comp.order = index;
            });

            onTemplateChange({
                ...template,
                components: newComponents
            });
        }
    };

    const removeComponent = (componentId: string) => {
        const newComponents = template.components.filter(comp => comp.id !== componentId);
        newComponents.forEach((comp, index) => {
            comp.order = index;
        });

        onTemplateChange({
            ...template,
            components: newComponents
        });
    };

    const duplicateComponent = (componentId: string) => {
        const componentIndex = template.components.findIndex(comp => comp.id === componentId);
        if (componentIndex === -1) return;

        const originalComponent = template.components[componentIndex];
        const duplicatedComponent: TemplateComponent = {
            ...originalComponent,
            id: `tc-${Date.now()}`,
            order: componentIndex + 1
        };

        const newComponents = [...template.components];
        newComponents.splice(componentIndex + 1, 0, duplicatedComponent);

        // Update order
        newComponents.forEach((comp, index) => {
            comp.order = index;
        });

        onTemplateChange({
            ...template,
            components: newComponents
        });
    };

    const updateComponentDuration = (componentId: string, duration: number) => {
        const newComponents = template.components.map(comp =>
            comp.id === componentId ? { ...comp, duration } : comp
        );

        onTemplateChange({
            ...template,
            components: newComponents
        });
    };

    const filteredComponents = availableComponents.filter(component => {
        const matchesCategory = selectedCategory === 'All' || component.type === selectedCategory;
        const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (component.description && component.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Box display="flex" sx={{
                height: compact ? 'auto' : 'calc(100vh - 200px)',
                flexDirection: compact ? 'column' : 'row'
            }}>
                {/* Component Library Sidebar */}
                {showComponentLibrary && (
                    <Paper
                        sx={{
                            width: compact ? '100%' : 400,
                            borderRadius: 0,
                            borderRight: compact ? 0 : 1,
                            borderBottom: compact ? 1 : 0,
                            borderColor: 'divider',
                            overflow: 'auto',
                            maxHeight: compact ? '300px' : 'auto'
                        }}
                    >
                        <Box p={2}>
                            <Typography variant={compact ? "subtitle1" : "h6"} gutterBottom>
                                Component Library
                            </Typography>

                            {/* Search */}
                            <TextField
                                fullWidth
                                placeholder="Search components..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                                size="small"
                            />

                            {/* Category Filter */}
                            <FormControl fullWidth sx={{ mb: 3 }} size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={selectedCategory}
                                    label="Category"
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {componentCategories.map(category => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Droppable droppableId="component-library" isDropDisabled>
                                {(provided) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                    >
                                        <Stack spacing={1}>
                                            {filteredComponents.slice(0, compact ? 4 : filteredComponents.length).map((component, index) => (
                                                <Draggable
                                                    key={component.id}
                                                    draggableId={component.id.toString()}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            variant="outlined"
                                                            sx={{
                                                                cursor: 'move',
                                                                transform: snapshot.isDragging ? 'rotate(1deg)' : 'none',
                                                                '&:hover': {
                                                                    boxShadow: 2
                                                                }
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Box
                                                                        sx={{
                                                                            width: 32,
                                                                            height: 32,
                                                                            borderRadius: 1,
                                                                            bgcolor: component.type === 'PRODUCTION' ? '#2196F320' : '#4CAF5020',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center'
                                                                        }}
                                                                    >
                                                                        <VideocamIcon sx={{ color: component.type === 'PRODUCTION' ? '#2196F3' : '#4CAF50', fontSize: 16 }} />
                                                                    </Box>
                                                                    <Stack flex={1} spacing={0.5}>
                                                                        <Typography variant="body2" fontWeight="medium">
                                                                            {component.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {component.description}
                                                                        </Typography>
                                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                                            <AccessTimeIcon sx={{ fontSize: 12 }} />
                                                                            <Typography variant="caption">
                                                                                {component.estimated_duration || 0}min
                                                                            </Typography>
                                                                        </Box>
                                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                                            <AttachMoneyIcon sx={{ fontSize: 12 }} />
                                                                            <Typography variant="caption">
                                                                                {component.base_task_hours}h
                                                                            </Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                        </Stack>
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Box>
                    </Paper>
                )}

                {/* Template Components */}
                <Box flex={1} overflow="auto" p={compact ? 2 : 3} sx={{ width: '100%' }}>
                    <Typography variant={compact ? "subtitle1" : "h6"} gutterBottom>
                        Template Components
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {showComponentLibrary ? 'Drag components from the library or reorder existing ones' : 'Reorder components as needed'}
                    </Typography>

                    <Droppable droppableId="template-components">
                        {(provided, snapshot) => (
                            <Box
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{
                                    minHeight: compact ? 200 : 400,
                                    bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                                    borderRadius: 1,
                                    p: 2,
                                    border: '2px dashed',
                                    borderColor: snapshot.isDraggingOver ? 'primary.main' : 'divider'
                                }}
                            >
                                {template.components.length === 0 ? (
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        justifyContent="center"
                                        height={compact ? 150 : 300}
                                        color="text.secondary"
                                    >
                                        <LayersIcon sx={{ fontSize: 60, mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            No components added yet
                                        </Typography>
                                        <Typography variant="body2">
                                            {showComponentLibrary ? 'Drag components from the library to get started' : 'No components configured'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={2}>
                                        {template.components.map((templateComponent, index) => (
                                            <Draggable
                                                key={templateComponent.id}
                                                draggableId={templateComponent.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        variant="outlined"
                                                        sx={{
                                                            transform: snapshot.isDragging ? 'rotate(1deg)' : 'none',
                                                            '&:hover': {
                                                                boxShadow: 2
                                                            }
                                                        }}
                                                    >
                                                        <CardContent>
                                                            <Box display="flex" alignItems="center" gap={2}>
                                                                <Box
                                                                    {...provided.dragHandleProps}
                                                                    sx={{
                                                                        cursor: 'move',
                                                                        color: 'text.secondary',
                                                                        '&:hover': { color: 'text.primary' }
                                                                    }}
                                                                >
                                                                    <DragIndicatorIcon />
                                                                </Box>

                                                                <Box
                                                                    sx={{
                                                                        width: 48,
                                                                        height: 48,
                                                                        borderRadius: 1,
                                                                        bgcolor: templateComponent.component?.type === 'PRODUCTION' ? '#2196F320' : '#4CAF5020',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <VideocamIcon sx={{ color: templateComponent.component?.type === 'PRODUCTION' ? '#2196F3' : '#4CAF50' }} />
                                                                </Box>

                                                                <Box flex={1}>
                                                                    <Typography variant="h6">
                                                                        {templateComponent.component?.name}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                        {templateComponent.component?.description}
                                                                    </Typography>
                                                                    <Stack direction="row" spacing={2}>
                                                                        <Chip
                                                                            size="small"
                                                                            label={templateComponent.component?.type}
                                                                            variant="outlined"
                                                                        />
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {templateComponent.component?.base_task_hours}h
                                                                        </Typography>
                                                                    </Stack>
                                                                </Box>

                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Tooltip title="Edit duration">
                                                                        <Box display="flex" alignItems="center" gap={1}>
                                                                            <AccessTimeIcon color="action" />
                                                                            <TextField
                                                                                size="small"
                                                                                type="number"
                                                                                value={templateComponent.duration || 0}
                                                                                onChange={(e) => updateComponentDuration(
                                                                                    templateComponent.id,
                                                                                    parseInt(e.target.value) || 0
                                                                                )}
                                                                                InputProps={{
                                                                                    endAdornment: <InputAdornment position="end">min</InputAdornment>,
                                                                                }}
                                                                                sx={{ width: 80 }}
                                                                                inputProps={{ min: 1 }}
                                                                            />
                                                                        </Box>
                                                                    </Tooltip>

                                                                    <Tooltip title="Duplicate component">
                                                                        <IconButton
                                                                            onClick={() => duplicateComponent(templateComponent.id)}
                                                                            color="primary"
                                                                            size="small"
                                                                        >
                                                                            <ContentCopyIcon />
                                                                        </IconButton>
                                                                    </Tooltip>

                                                                    <Tooltip title="Remove component">
                                                                        <IconButton
                                                                            onClick={() => removeComponent(templateComponent.id)}
                                                                            color="error"
                                                                            size="small"
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Stack>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                    </Stack>
                                )}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </Box>
            </Box>
        </DragDropContext>
    );
}
