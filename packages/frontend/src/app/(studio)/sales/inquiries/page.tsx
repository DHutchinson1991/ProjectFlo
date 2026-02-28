"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { inquiriesService } from '@/lib/api';
import { Inquiry, InquiryStatus, CreateInquiryData } from '@/lib/types';
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

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ message, severity });
    };

    // Navigation to inquiry detail page
    const handleInquiryClick = (inquiryId: number) => {
        router.push(`/sales/inquiries/${inquiryId}`);
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

    const getStatusColor = (status: InquiryStatus) => {
        switch (status) {
            case InquiryStatus.NEW: return 'info';
            case InquiryStatus.CONTACTED: return 'warning';
            case InquiryStatus.PROPOSAL_SENT: return 'secondary';
            case InquiryStatus.WON: return 'success';
            case InquiryStatus.LOST: return 'error';
            default: return 'default';
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
                                        <TableCell>Source</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Wedding Date</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell>Created</TableCell>
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
                                                <Chip label={inquiry.source} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={inquiry.status}
                                                    size="small"
                                                    color={getStatusColor(inquiry.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {inquiry.event_date
                                                    ? inquiry.event_date.toLocaleDateString()
                                                    : '-'
                                                }
                                            </TableCell>
                                            <TableCell>{inquiry.notes || '-'}</TableCell>
                                            <TableCell>{inquiry.created_at.toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

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
