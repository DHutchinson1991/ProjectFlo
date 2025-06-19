import React from 'react';
import {
    Card,
    CardContent,
    Grid,
    Typography,
    TextField,
    IconButton,
    Box,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Info as InfoIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { DeliverableTemplate } from '../../../_shared/types';

interface DeliverableDetailsFormProps {
    deliverable: DeliverableTemplate;
    // Editing states
    isEditingName: boolean;
    isEditingDescription: boolean;
    isEditingVersion: boolean;
    isEditingTimeline: boolean;
    isEditingMusicType: boolean;
    setIsEditingName: (editing: boolean) => void;
    setIsEditingDescription: (editing: boolean) => void;
    setIsEditingVersion: (editing: boolean) => void;
    setIsEditingTimeline: (editing: boolean) => void;
    setIsEditingMusicType: (editing: boolean) => void;
    // Template values
    templateName: string;
    templateDescription: string;
    templateVersion: string;
    templateTimeline: string;
    templateMusicType: string;
    setTemplateName: (name: string) => void;
    setTemplateDescription: (description: string) => void;
    setTemplateVersion: (version: string) => void;
    setTemplateTimeline: (timeline: string) => void;
    setTemplateMusicType: (musicType: string) => void;
}

export default function DeliverableDetailsForm({
    deliverable,
    isEditingName,
    isEditingDescription,
    isEditingVersion,
    isEditingTimeline,
    isEditingMusicType,
    setIsEditingName,
    setIsEditingDescription,
    setIsEditingVersion,
    setIsEditingTimeline,
    setIsEditingMusicType,
    templateName,
    templateDescription,
    templateVersion,
    templateTimeline,
    templateMusicType,
    setTemplateName,
    setTemplateDescription,
    setTemplateVersion,
    setTemplateTimeline,
    setTemplateMusicType
}: DeliverableDetailsFormProps) {
    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <InfoIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Template Information</Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        {isEditingName ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <TextField
                                    fullWidth
                                    label="Template Name"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    size="small"
                                />
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => setIsEditingName(false)}
                                >
                                    <CheckIcon />
                                </IconButton>
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={() => {
                                        setIsEditingName(false);
                                        setTemplateName(deliverable?.name || '');
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle2" color="text.secondary">Template Name</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" fontWeight="medium">{deliverable.name}</Typography>
                            </Stack>
                        )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        {isEditingVersion ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <TextField
                                    fullWidth
                                    label="Version"
                                    value={templateVersion}
                                    onChange={(e) => setTemplateVersion(e.target.value)}
                                    size="small"
                                />
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => setIsEditingVersion(false)}
                                >
                                    <CheckIcon />
                                </IconButton>
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={() => {
                                        setIsEditingVersion(false);
                                        setTemplateVersion(deliverable?.version || '');
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle2" color="text.secondary">Version</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingVersion(true)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" fontWeight="medium">{deliverable.version || 'N/A'}</Typography>
                            </Stack>
                        )}
                    </Grid>

                    <Grid item xs={12}>
                        {isEditingDescription ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    size="small"
                                    multiline
                                    rows={3}
                                />
                                <Box display="flex" flexDirection="column" gap={1}>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={() => setIsEditingDescription(false)}
                                    >
                                        <CheckIcon />
                                    </IconButton>
                                    <IconButton
                                        color="secondary"
                                        size="small"
                                        onClick={() => {
                                            setIsEditingDescription(false);
                                            setTemplateDescription(deliverable?.description || '');
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingDescription(true)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" fontWeight="medium">
                                    {deliverable.description || 'No description provided'}
                                </Typography>
                            </Stack>
                        )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        {isEditingTimeline ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <TextField
                                    fullWidth
                                    label="Delivery Timeline (days)"
                                    value={templateTimeline}
                                    onChange={(e) => setTemplateTimeline(e.target.value)}
                                    size="small"
                                    type="number"
                                />
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => setIsEditingTimeline(false)}
                                >
                                    <CheckIcon />
                                </IconButton>
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={() => {
                                        setIsEditingTimeline(false);
                                        setTemplateTimeline(deliverable?.delivery_timeline?.toString() || '');
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle2" color="text.secondary">Delivery Timeline</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingTimeline(true)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" fontWeight="medium">
                                    {deliverable.delivery_timeline ? `${deliverable.delivery_timeline} days` : 'N/A'}
                                </Typography>
                            </Stack>
                        )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        {isEditingMusicType ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Music Type</InputLabel>
                                    <Select
                                        value={templateMusicType}
                                        onChange={(e) => setTemplateMusicType(e.target.value)}
                                        label="Music Type"
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="INSTRUMENTAL">Instrumental</MenuItem>
                                        <MenuItem value="VOCAL">Vocal</MenuItem>
                                        <MenuItem value="AMBIENT">Ambient</MenuItem>
                                    </Select>
                                </FormControl>
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => setIsEditingMusicType(false)}
                                >
                                    <CheckIcon />
                                </IconButton>
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={() => {
                                        setIsEditingMusicType(false);
                                        setTemplateMusicType(deliverable?.default_music_type || '');
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="subtitle2" color="text.secondary">Music Type</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditingMusicType(true)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Box>
                                <Typography variant="body1" fontWeight="medium">
                                    {deliverable.default_music_type || 'N/A'}
                                </Typography>
                            </Stack>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
