"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Snackbar,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    Delete as DeleteIcon,
    Place as PlaceIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { inquiriesService } from '@/lib/api';
import { Inquiry, CreateInquiryData, InquiryStatus } from '@/lib/types';
import { useBrand } from '../../../providers/BrandProvider';

export default function InquiriesPage() {
    // Brand context
    const { currentBrand } = useBrand();

    // Router for navigation
    const router = useRouter();

    // Data states
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Notification states
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ message, severity });
    };

    // Navigation to inquiry detail page
    const handleInquiryClick = (inquiryId: number) => {
        router.push(`/sales/inquiries/${inquiryId}`);
    };

    // Delete handlers
    const handleDeleteClick = (e: React.MouseEvent, inquiry: Inquiry) => {
        e.stopPropagation();
        setInquiryToDelete(inquiry);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!inquiryToDelete) return;
        setIsDeleting(true);
        try {
            await inquiriesService.delete(inquiryToDelete.id);
            setInquiries(prev => prev.filter(i => i.id !== inquiryToDelete.id));
            showNotification('Inquiry deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete inquiry:', error);
            showNotification('Failed to delete inquiry', 'error');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setInquiryToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setInquiryToDelete(null);
    };

    // Create a generic inquiry and redirect to edit
    const handleCreate = async () => {
        try {
            // Create a generic placeholder inquiry with blank fields
            // Note: Email is required by backend, so we generate a temporary hidden one
            // Time is added to ensure uniqueness
            const newInquiryData: CreateInquiryData = {
                first_name: '', // Blank
                last_name: '',  // Blank
                email: `pending_${Date.now()}@temp.com`, // Hidden in UI
                phone_number: '', 
                wedding_date: new Date().toISOString(), // Required by backend
                status: InquiryStatus.NEW,
                notes: '', 
                venue_details: '', 
                lead_source: '', 
                lead_source_details: '', 
            };

            const newInquiry = await inquiriesService.create(newInquiryData);
            showNotification('New inquiry created. Redirecting...', 'success');
            
            // Redirect immediately to the details page for inline editing
            router.push(`/sales/inquiries/${newInquiry.id}`);
        } catch (error) {
            console.error('Failed to create inquiry:', error);
            showNotification('Failed to create inquiry', 'error');
        }
    };

    // Load inquiries
    const loadInquiries = async () => {
        try {
            setIsLoading(true);
            const data = await inquiriesService.getAll();
            setInquiries(data);
        } catch (error) {
            console.error('Failed to load inquiries:', error);
            showNotification('Failed to load inquiries', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentBrand) {
            loadInquiries();
        }
    }, [currentBrand]);

    const getPipelineStageColor = (stage: string | null | undefined) => {
        switch (stage) {
            case 'Contract Stage': return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.4)' };
            case 'Proposal Sent': return { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: 'rgba(139,92,246,0.4)' };
            case 'Estimate Accepted': return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.4)' };
            case 'Estimate Sent': return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.4)' };
            case 'Estimate Created': return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.4)' };
            default: return { bg: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: 'rgba(6,182,212,0.4)' }; // New Lead
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Inquiries
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ px: 3 }}
                >
                    New Inquiry
                </Button>
            </Box>

            {/* Inquiries Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                        All Inquiries
                    </Typography>

                    {isLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                Loading inquiries...
                            </Typography>
                        </Box>
                    ) : inquiries.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                No inquiries found
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleCreate}
                            >
                                Create Your First Inquiry
                            </Button>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Contact</TableCell>
                                        <TableCell>Pipeline Stage</TableCell>
                                        <TableCell>Event Date</TableCell>
                                        <TableCell>Package</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Venue</TableCell>
                                        <TableCell>Date of Inquiry</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inquiries.map((inquiry) => (
                                        <TableRow
                                            key={inquiry.id}
                                            onClick={() => handleInquiryClick(inquiry.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {inquiry.contact.full_name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        {inquiry.contact.email && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {inquiry.contact.email}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    {inquiry.contact.phone_number && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {inquiry.contact.phone_number}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {inquiry.contact.company_name && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                            <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {inquiry.contact.company_name}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const stage = inquiry.pipeline_stage || 'New Lead';
                                                    const { bg, color, border } = getPipelineStageColor(stage);
                                                    return (
                                                        <Chip
                                                            label={stage}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: bg,
                                                                color,
                                                                border: `1px solid ${border}`,
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {inquiry.event_date
                                                    ? inquiry.event_date.toLocaleDateString()
                                                    : '-'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {inquiry.selected_package
                                                    ? (
                                                        <Typography variant="body2">
                                                            {inquiry.selected_package.name}
                                                        </Typography>
                                                    )
                                                    : inquiry.package_contents_snapshot?.package_name
                                                        ? (
                                                            <Typography variant="body2">
                                                                {inquiry.package_contents_snapshot.package_name}
                                                            </Typography>
                                                        )
                                                        : <Typography variant="body2" color="text.secondary">-</Typography>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const price = inquiry.primary_estimate_total;
                                                    const currency = currentBrand?.currency || 'GBP';
                                                    if (price == null) return <Typography variant="body2" color="text.secondary">-</Typography>;
                                                    return (
                                                        <Typography variant="body2">
                                                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(price)}
                                                        </Typography>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {inquiry.venue_details
                                                    ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="body2">
                                                                {inquiry.venue_details}
                                                            </Typography>
                                                        </Box>
                                                    )
                                                    : <Typography variant="body2" color="text.secondary">-</Typography>
                                                }
                                            </TableCell>
                                            <TableCell>{inquiry.created_at.toLocaleDateString()}</TableCell>
                                            <TableCell align="right" onClick={e => e.stopPropagation()}>
                                                <Tooltip title="Delete inquiry">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={(e) => handleDeleteClick(e, inquiry)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Delete Inquiry</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the inquiry for{' '}
                        <strong>{inquiryToDelete?.contact.full_name}</strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={() => setNotification(null)}
            >
                <Alert
                    onClose={() => setNotification(null)}
                    severity={notification?.severity || 'info'}
                    sx={{ width: '100%' }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
