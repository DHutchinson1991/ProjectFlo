"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Box,
    Typography,
    Button,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Card,
} from "@mui/material";
import {
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    VideoLibrary as VideoLibraryIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";

import Loading from "../../../../components/Loading";
import { contentAPI } from "../_shared/api";
import { ContentTemplate } from "../_shared/types";

// Import modals
import { DeleteConfirmDialog } from "./components";

export default function ContentPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState<ContentTemplate[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Menu and modal states
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedContent, setSelectedContent] = useState<ContentTemplate | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingContent, setDeletingContent] = useState<ContentTemplate | null>(null);

    const fetchContent = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedContent = await contentAPI.getAll();
            console.log("Fetched Content:", JSON.stringify(fetchedContent, null, 2));
            setContent(fetchedContent);
        } catch (err) {
            console.error("Failed to fetch content:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleMenuClick = (
        event: React.MouseEvent<HTMLElement>,
        contentItem: ContentTemplate
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedContent(contentItem);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedContent(null);
    };

    const handleOpenDeleteModal = (contentItem: ContentTemplate) => {
        setDeletingContent(contentItem);
        setIsDeleteModalOpen(true);
        handleMenuClose();
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeletingContent(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingContent) return;
        try {
            await contentAPI.delete(deletingContent.id);
            fetchContent(); // Refresh the list
            setIsDeleteModalOpen(false);
            setDeletingContent(null);
        } catch (apiError) {
            console.error("Failed to delete content:", apiError);
            throw apiError;
        }
    };

    if (isLoading && content.length === 0) {
        return <Loading message="Loading content templates..." />;
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" component="h1">
                        Content Templates
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create and manage content templates with visual builder
                    </Typography>
                </Box>
                <Button
                    component={Link}
                    href="/app-crm/settings/services/content/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                >
                    Create Template
                </Button>
            </Box>

            {isLoading && content.length > 0 && (
                <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
            )}

            {!isLoading && content.length === 0 ? (
                <Card sx={{ textAlign: "center", p: 4 }}>
                    <VideoLibraryIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        No Content Templates Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Get started by creating your first content template
                    </Typography>
                    <Button
                        component={Link}
                        href="/app-crm/settings/services/content/new"
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Create Your First Template
                    </Button>
                </Card>
            ) : (
                <Card>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Template Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Music</TableCell>
                                    <TableCell>Delivery</TableCell>
                                    <TableCell>Components</TableCell>
                                    <TableCell>Version</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {content.map((contentItem) => (
                                    <TableRow key={contentItem.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Link
                                                    href={`/app-crm/settings/services/content/${contentItem.id}`}
                                                    passHref
                                                    legacyBehavior
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight="bold"
                                                        component="a"
                                                        sx={{
                                                            textDecoration: 'none',
                                                            color: 'primary.main',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        {contentItem.name}
                                                    </Typography>
                                                </Link>
                                                {contentItem.description && (
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        {contentItem.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={contentItem.type}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={contentItem.is_active ? "Active" : "Inactive"}
                                                size="small"
                                                color={contentItem.is_active ? "success" : "default"}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {contentItem.includes_music ? (
                                                <Chip
                                                    label="Yes"
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {contentItem.delivery_timeline ? `${contentItem.delivery_timeline} days` : "Not set"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {contentItem.template_defaults && contentItem.template_defaults.length > 0
                                                    ? `${contentItem.template_defaults.length} component${contentItem.template_defaults.length !== 1 ? 's' : ''}`
                                                    : "0 components"
                                                }
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                v{contentItem.version}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={(e) => handleMenuClick(e, contentItem)}
                                                size="small"
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {content.length === 0 && !isLoading && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                No content templates found
                            </Typography>
                        </Box>
                    )}
                </Card>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem
                    component={Link}
                    href={selectedContent ? `/app-crm/settings/services/content/${selectedContent.id}` : "#"}
                    onClick={handleMenuClose}
                >
                    <EditIcon sx={{ mr: 1 }} fontSize="small" />
                    View/Edit
                </MenuItem>
                <MenuItem
                    onClick={() => selectedContent && handleOpenDeleteModal(selectedContent)}
                    sx={{ color: "error.main" }}
                >
                    <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                    Delete
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                contentName={deletingContent?.name || "this content"}
            />
        </Box>
    );
}
