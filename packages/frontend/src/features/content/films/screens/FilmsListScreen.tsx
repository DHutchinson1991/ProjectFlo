"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Box, Typography, Button, Alert, CircularProgress, IconButton, Menu, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card,
} from "@mui/material";
import {
    Add as AddIcon, MoreVert as MoreVertIcon, VideoLibrary as VideoLibraryIcon,
    Edit as EditIcon, Delete as DeleteIcon,
} from "@mui/icons-material";
import { useBrand } from "@/features/platform/brand";
import type { Film } from "@/features/content/films/types";
import { useFilms } from "@/features/content/films/hooks/useFilms";

type FilmTemplate = Film;

function Loading({ message }: { message: string }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>{message}</Typography>
        </Box>
    );
}

function DeleteConfirmDialog({ open, onClose, onConfirm, filmName }: { open: boolean; onClose: () => void; onConfirm: () => void; filmName: string }) {
    // TODO: Implement proper delete confirmation dialog
    console.log("Delete dialog:", { open, onClose, onConfirm, filmName });
    return null;
}

export function FilmsListScreen() {
    const { currentBrand } = useBrand();
    const { films, isLoading, error, deleteFilm } = useFilms(currentBrand?.id);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedContent, setSelectedContent] = useState<FilmTemplate | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingContent, setDeletingContent] = useState<FilmTemplate | null>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, contentItem: FilmTemplate) => {
        setAnchorEl(event.currentTarget);
        setSelectedContent(contentItem);
    };

    const handleMenuClose = () => { setAnchorEl(null); setSelectedContent(null); };

    const handleOpenDeleteModal = (contentItem: FilmTemplate) => {
        setDeletingContent(contentItem);
        setIsDeleteModalOpen(true);
        handleMenuClose();
    };

    const handleCloseDeleteModal = () => { setIsDeleteModalOpen(false); setDeletingContent(null); };

    const handleDeleteConfirm = async () => {
        if (!deletingContent) return;
        try {
            await deleteFilm(deletingContent.id);
            setIsDeleteModalOpen(false);
            setDeletingContent(null);
        } catch (apiError) {
            console.error("Failed to delete film:", apiError);
        }
    };

    if (!currentBrand) {
        return <Box sx={{ p: 3 }}><Alert severity="info">Please select a brand to view films.</Alert></Box>;
    }

    if (isLoading && films.length === 0) return <Loading message="Loading film templates..." />;

    if (error) {
        return <Box sx={{ p: 3 }}><Alert severity="error">{error || "Failed to load films"}</Alert></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" component="h1">Film Manager</Typography>
                    <Typography variant="body1" color="text.secondary">Create and manage film templates with visual builder</Typography>
                </Box>
                <Button component={Link} href="/designer/films/new" variant="contained" startIcon={<AddIcon />}>Create Film Template</Button>
            </Box>

            {isLoading && films.length > 0 && <CircularProgress sx={{ display: "block", margin: "20px auto" }} />}

            {!isLoading && films.length === 0 ? (
                <Card sx={{ textAlign: "center", p: 4 }}>
                    <VideoLibraryIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>No Films Found</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Get started by creating your first film</Typography>
                    <Button component={Link} href="/designer/films/new" variant="contained" startIcon={<AddIcon />}>Create Your First Film</Button>
                </Card>
            ) : (
                <Card>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Template Name</TableCell>
                                    <TableCell>Scenes</TableCell>
                                    <TableCell>Subjects</TableCell>
                                    <TableCell>Tracks</TableCell>
                                    <TableCell>Updated</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {films.map((contentItem: FilmTemplate) => (
                                    <TableRow key={contentItem.id} hover>
                                        <TableCell>
                                            <Link href={`/designer/films/${contentItem.id}`} passHref legacyBehavior>
                                                <Typography variant="subtitle2" fontWeight="bold" component="a" sx={{ textDecoration: "none", color: "primary.main", "&:hover": { textDecoration: "underline" } }}>
                                                    {contentItem.name}
                                                </Typography>
                                            </Link>
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{contentItem.scenes?.length ?? 0}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{contentItem.subjects?.length ?? 0}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{contentItem.tracks?.length ?? 0}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" color="text.secondary">{new Date(contentItem.updated_at).toLocaleDateString()}</Typography></TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={(e) => handleMenuClick(e, contentItem)} size="small"><MoreVertIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {films.length === 0 && !isLoading && (
                        <Box sx={{ p: 4, textAlign: "center" }}><Typography color="text.secondary">No film templates found</Typography></Box>
                    )}
                </Card>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem component={Link} href={selectedContent ? `/designer/films/${selectedContent.id}` : "#"} onClick={handleMenuClose}>
                    <EditIcon sx={{ mr: 1 }} fontSize="small" />View/Edit
                </MenuItem>
                <MenuItem onClick={() => selectedContent && handleOpenDeleteModal(selectedContent)} sx={{ color: "error.main" }}>
                    <DeleteIcon sx={{ mr: 1 }} fontSize="small" />Delete
                </MenuItem>
            </Menu>

            <DeleteConfirmDialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal} onConfirm={handleDeleteConfirm} filmName={deletingContent?.name || "this film"} />
        </Box>
    );
}
