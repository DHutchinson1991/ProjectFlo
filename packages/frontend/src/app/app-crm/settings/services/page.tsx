'use client';

import React from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
} from '@mui/material';
import {
    VideoLibrary as VideoLibraryIcon,
    Extension as ExtensionIcon,
    Movie as MovieIcon,
    Palette as PaletteIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const serviceCards = [
    {
        title: 'Deliverable Templates',
        description: 'Create and manage deliverable templates with visual builder',
        icon: <VideoLibraryIcon sx={{ fontSize: 40 }} />,
        href: '/app-crm/settings/services/deliverables',
        color: 'primary.main',
        badge: 'Builder Available'
    },
    {
        title: 'Video Components',
        description: 'Manage video components and their configurations',
        icon: <ExtensionIcon sx={{ fontSize: 40 }} />,
        href: '/app-crm/settings/services/video-components',
        color: 'secondary.main',
        badge: 'Library'
    },
    {
        title: 'Coverage Scenes',
        description: 'Define coverage scenes for wedding and event videography',
        icon: <MovieIcon sx={{ fontSize: 40 }} />,
        href: '/app-crm/settings/services/coverage-scenes',
        color: 'success.main',
        badge: 'Scenes'
    },
    {
        title: 'Editing Styles',
        description: 'Manage editing styles and visual treatments',
        icon: <PaletteIcon sx={{ fontSize: 40 }} />,
        href: '/app-crm/settings/services/editing-styles',
        color: 'warning.main',
        badge: 'Styles'
    }
];

export default function ServicesPage() {
    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                    Services Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage all aspects of your video production services and templates
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {serviceCards.map((card, index) => (
                    <Grid item xs={12} sm={6} lg={3} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3 }}>
                                <Box sx={{ color: card.color, mb: 2 }}>
                                    {card.icon}
                                </Box>

                                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                                    {card.title}
                                </Typography>

                                <Chip
                                    label={card.badge}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mb: 2 }}
                                />

                                <Typography variant="body2" color="text.secondary">
                                    {card.description}
                                </Typography>
                            </CardContent>

                            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                <Button
                                    component={Link}
                                    href={card.href}
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        bgcolor: card.color,
                                        '&:hover': {
                                            bgcolor: card.color,
                                            opacity: 0.8
                                        }
                                    }}
                                >
                                    Manage
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Quick Stats Section */}
            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Quick Overview
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Deliverable Templates
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="secondary">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Video Components
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Coverage Scenes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="warning.main">
                                    0
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Editing Styles
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
