'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Grid,
    CircularProgress,
    Typography,
    IconButton,
    Collapse,
    Chip,
    Button
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Layers as LayersIcon,
    Save as SaveIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { deliverableAPI, componentAPI } from '../../_shared/api';
import { DeliverableTemplate, ComponentLibrary } from '../../_shared/types';
import { VisualTemplate } from './types';
import {
    DeliverableHeader,
    DeliverableStatsCards,
    StyleManagementSection,
    DeliverableComponentBuilder,
    DeliverableDangerZone
} from './components';

export default function DeliverableDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [deliverable, setDeliverable] = useState<DeliverableTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [visualTemplate, setVisualTemplate] = useState<VisualTemplate | null>(null);
    const [availableComponents, setAvailableComponents] = useState<ComponentLibrary[]>([]);
    const [componentsExpanded, setComponentsExpanded] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const deliverableId = params.id as string;

    useEffect(() => {
        if (deliverableId) {
            loadDeliverable();
            loadAvailableComponents();
        }
    }, [deliverableId]);

    const loadAvailableComponents = async () => {
        try {
            const components = await componentAPI.getAllComponents();
            setAvailableComponents(components);
        } catch (error) {
            console.error('Error loading components:', error);
        }
    };

    // Convert ComponentLibrary to VisualDeliverableBuilder format
    const convertComponentsForBuilder = (components: ComponentLibrary[]) => {
        return components.map(comp => ({
            id: comp.id.toString(),
            name: comp.name,
            description: comp.description || '',
            category: comp.type === 'COVERAGE_BASED' ? 'Main Content' : 'Production',
            baseTimeMinutes: comp.estimated_duration || 10,
            complexityMultiplier: comp.complexity_score || 1.0,
            baseCost: parseFloat(comp.base_task_hours) * 50, // Rough conversion
            icon: 'Camera',
            color: comp.type === 'COVERAGE_BASED' ? '#2196F3' : '#4CAF50'
        }));
    };

    const loadDeliverable = async () => {
        try {
            const data = await deliverableAPI.getTemplate(parseInt(deliverableId));
            setDeliverable(data);

            // Convert and set visual template
            const template = convertToVisualTemplate(data);
            setVisualTemplate(template);
        } catch (error) {
            console.error('Error loading deliverable:', error);
            router.push('/app-crm/settings/services/deliverables');
        } finally {
            setLoading(false);
        }
    };

    // Convert deliverable to visual builder format
    const convertToVisualTemplate = (deliverable: DeliverableTemplate): VisualTemplate => {
        console.log('Converting deliverable:', deliverable.name); console.log('Has default components:', deliverable.template_defaults?.length || 0);
        console.log('Has regular components:', deliverable.assigned_components?.length || 0);

        // Priority: Use persistent components (deliverable.assigned_components) if they exist,
        // otherwise fall back to template defaults (template_defaults)
        const regularComponents = deliverable.assigned_components || [];
        const defaultComponents = deliverable.template_defaults || [];

        const convertedComponents: VisualTemplate['components'] = [];

        // If we have persistent components, use those (they override template defaults)
        if (regularComponents.length > 0) {
            console.log('Using persistent components');
            regularComponents.forEach((comp, index) => {
                const compName = comp.component?.name || `Component ${index + 1}`;
                const compDesc = comp.component?.description || 'Video component';

                convertedComponents.push({
                    id: `rc-${comp.component_id}-${index}`,
                    componentId: comp.component_id.toString(),
                    order: comp.order_index,
                    duration: comp.duration_override || comp.component?.estimated_duration || 10,
                    component: {
                        id: comp.component_id.toString(),
                        name: compName,
                        description: compDesc,
                        category: comp.editing_style || (comp.component?.type === 'COVERAGE_BASED' ? 'Main Content' : 'Production'),
                        baseTimeMinutes: comp.component?.estimated_duration || 10,
                        complexityMultiplier: comp.component?.complexity_score || 1.0,
                        baseCost: parseFloat(comp.calculated_base_price || '50'),
                        icon: 'VideoFile',
                        color: '#4CAF50'
                    }
                });
            });
        } else if (defaultComponents.length > 0) {
            // Fall back to template defaults if no persistent components exist
            console.log('Using template default components');
            defaultComponents.forEach((comp, index) => {
                const sceneName = comp.coverage_scene?.name || `Scene ${index + 1}`;
                const sceneDesc = comp.coverage_scene?.description || 'Coverage scene';

                convertedComponents.push({
                    id: `dc-${comp.id}`,
                    componentId: comp.id.toString(),
                    order: index,
                    duration: 10, // Default duration for coverage scenes
                    component: {
                        id: comp.id.toString(),
                        name: sceneName,
                        description: sceneDesc,
                        category: 'Coverage',
                        baseTimeMinutes: 10,
                        complexityMultiplier: 1.0,
                        baseCost: 50,
                        icon: 'Camera',
                        color: '#2196F3'
                    }
                });
            });
        }

        // Sort by order
        convertedComponents.sort((a, b) => a.order - b.order);

        // Calculate totals from assigned components (using backend calculated values)
        const totalDuration = convertedComponents.reduce((sum, comp) => sum + (comp.duration || 0), 0);
        const totalHours = regularComponents.reduce((sum: number, comp) => sum + parseFloat(comp.calculated_task_hours || '0'), 0);
        const estimatedCost = regularComponents.reduce((sum: number, comp) => sum + parseFloat(comp.calculated_base_price || '0'), 0);
        const complexity = regularComponents.length > 0
            ? regularComponents.reduce((sum: number, comp) => sum + (comp.component?.complexity_score || 1), 0) / regularComponents.length
            : 1.0;

        console.log('Converted components:', convertedComponents.length);
        console.log('Total hours:', totalHours);
        console.log('Total cost:', estimatedCost);

        return {
            id: deliverable.id.toString(),
            name: deliverable.name,
            description: deliverable.description || '',
            category: deliverable.type,
            components: convertedComponents,
            totalDuration,
            totalHours,
            estimatedCost,
            complexity
        };
    };

    const handleVisualTemplateChange = (template: VisualTemplate) => {
        console.log('Visual template changed:', template.name, 'Components:', template.components.length);
        setVisualTemplate(template);
        // Note: Changes are not auto-saved. Use the Save button to persist changes.
    };

    const handleManualSave = () => {
        if (visualTemplate && deliverable) {
            // Save immediately
            saveTemplateChanges(visualTemplate);
        }
    };

    const saveTemplateChanges = async (template: VisualTemplate) => {
        try {
            if (!deliverable) return;

            setIsSaving(true);
            console.log('Saving template changes for:', template.name);
            console.log('Components to save:', template.components.map(c => ({
                id: c.componentId,
                name: c.component?.name,
                order: c.order
            })));

            // Save basic template info
            const updateData = {
                name: template.name,
                description: template.description
            };

            // Save to backend
            const updatedDeliverable = await deliverableAPI.updateTemplate(deliverable.id, updateData);

            // Convert visual template components to backend format and save
            const components = template.components.map((comp, index) => ({
                component_id: parseInt(comp.componentId),
                order_index: index,
                editing_style: comp.component?.category, // Use category as editing style for now
                duration_override: comp.duration
            }));

            console.log('Formatted components for backend:', components);

            // Save components separately
            if (components.length > 0) {
                const updatedWithComponents = await deliverableAPI.updateComponents(deliverable.id, components);
                console.log('Components saved successfully, updated deliverable:', updatedWithComponents.name);

                // Update local deliverable state with the returned data
                setDeliverable(updatedWithComponents);

                // Reload the visual template to ensure it reflects the saved state
                const refreshedTemplate = convertToVisualTemplate(updatedWithComponents);
                setVisualTemplate(refreshedTemplate);
            } else {
                setDeliverable(updatedDeliverable);

                // Update visual template even if no components
                const refreshedTemplate = convertToVisualTemplate(updatedDeliverable);
                setVisualTemplate(refreshedTemplate);
            }

            console.log('Template and components saved successfully');
            setSaveSuccess(true);
            // Reset success state after 2 seconds
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving template changes:', error);
            // You might want to show a toast notification here
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deliverable) return;

        const confirmDelete = confirm(`Are you sure you want to delete "${deliverable.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            setDeleting(true);
            await deliverableAPI.deleteTemplate(deliverable.id);
            router.push('/app-crm/settings/services/deliverables');
        } catch (error) {
            console.error('Error deleting deliverable:', error);
            alert('Error deleting deliverable. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!deliverable) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: '100%', mx: 'auto', p: 3 }}>
            <DeliverableHeader
                deliverable={deliverable}
                onDeliverableUpdated={setDeliverable}
            />

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    {visualTemplate && (
                        <DeliverableStatsCards
                            visualTemplate={visualTemplate}
                            deliveryTimeline={deliverable.delivery_timeline || 0}
                        />
                    )}
                </Grid>

                <Grid item xs={12}>
                    <StyleManagementSection
                        deliverable={deliverable}
                        onDeliverableUpdated={setDeliverable}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                                p: 1,
                                borderRadius: 1
                            }}
                            onClick={() => setComponentsExpanded(!componentsExpanded)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                    Template Components
                                </Typography>
                                {visualTemplate && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                            label={`${visualTemplate.complexity.toFixed(1)} Complexity`}
                                            size="small"
                                            color="info"
                                            icon={<LayersIcon />}
                                        />
                                        <Chip
                                            label={`${visualTemplate.components.length} Components`}
                                            size="small"
                                            color="primary"
                                            icon={<LayersIcon />}
                                        />
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={
                                        isSaving ? <CircularProgress size={16} color="inherit" /> :
                                            saveSuccess ? <CheckIcon /> : <SaveIcon />
                                    }
                                    onClick={handleManualSave}
                                    disabled={isSaving}
                                    color={saveSuccess ? "success" : "primary"}
                                >
                                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Components'}
                                </Button>
                                <IconButton>
                                    {componentsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                        </Box>

                        <Collapse in={componentsExpanded}>
                            <DeliverableComponentBuilder
                                visualTemplate={visualTemplate}
                                onTemplateChange={handleVisualTemplateChange}
                                availableComponents={convertComponentsForBuilder(availableComponents)}
                            />
                        </Collapse>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <DeliverableDangerZone
                        onDelete={handleDelete}
                        deleting={deleting}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
