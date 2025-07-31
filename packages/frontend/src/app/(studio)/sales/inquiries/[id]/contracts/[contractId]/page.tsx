'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Container,
    Divider,
    IconButton,
    Toolbar,
    AppBar,
} from '@mui/material';
import {
    ArrowBack,
    Save,
    Preview,
    Send,
    Download,
    Gavel,
    Edit,
    History,
} from '@mui/icons-material';
import { contractsService } from '@/lib/api';

interface LocalContract {
    id: number;
    title: string;
    content?: unknown;
    status: string;
    created_at: string;
    updated_at: string;
    inquiry_id: number;
}

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [contract, setContract] = useState<LocalContract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('draft');
    const [content, setContent] = useState('');

    const inquiryId = parseInt(params.id as string);
    const contractId = parseInt(params.contractId as string);

    useEffect(() => {
        loadContract();
    }, [contractId]);

    const loadContract = async () => {
        try {
            setLoading(true);
            const data = await contractsService.getById(inquiryId, contractId);

            // Convert the API response to our local contract format
            const localContract: LocalContract = {
                id: data.id,
                title: data.title || '',
                content: data.content || {},
                status: data.status || 'draft',
                created_at: new Date(data.created_at).toISOString(),
                updated_at: new Date(data.updated_at).toISOString(),
                inquiry_id: data.inquiry_id,
            };

            setContract(localContract);
            setTitle(data.title || '');
            setStatus(data.status || 'draft');
            setContent('Enter contract content here...');
        } catch (err) {
            console.error('Error loading contract:', err);
            setError('Failed to load contract details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updateData = {
                title,
                content: {
                    text: content,
                    blocks: [],
                    updated_at: new Date().toISOString(),
                }
            };

            await contractsService.update(inquiryId, contractId, updateData);
            await loadContract(); // Refresh the data
        } catch (err) {
            console.error('Error saving contract:', err);
            setError('Failed to save contract');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'default';
            case 'review': return 'warning';
            case 'sent': return 'info';
            case 'signed': return 'success';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const formatStatus = (status: string) => {
        return status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Draft';
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!contract) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="warning">Contract not found</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            {/* Top Navigation Bar */}
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        onClick={() => router.back()}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>

                    <Gavel sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Contract: {contract.title}
                    </Typography>

                    <Chip
                        label={formatStatus(status)}
                        color={getStatusColor(status)}
                        variant="outlined"
                        sx={{ mr: 2 }}
                    />

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<Preview />}
                            size="small"
                        >
                            Preview
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving}
                            size="small"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Grid container spacing={3}>
                    {/* Main Content Area */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Edit />
                                    Contract Details
                                </Typography>

                                <Stack spacing={3}>
                                    <TextField
                                        label="Contract Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        fullWidth
                                        variant="outlined"
                                    />

                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={status}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            label="Status"
                                        >
                                            <MenuItem value="draft">Draft</MenuItem>
                                            <MenuItem value="review">Under Review</MenuItem>
                                            <MenuItem value="sent">Sent to Client</MenuItem>
                                            <MenuItem value="signed">Signed</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Divider />

                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        Contract Content
                                    </Typography>

                                    <TextField
                                        label="Contract Text"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={20}
                                        variant="outlined"
                                        placeholder="Enter contract terms, conditions, and details here..."
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                fontFamily: 'monospace',
                                                fontSize: '14px',
                                                lineHeight: 1.5,
                                            }
                                        }}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        <Stack spacing={3}>
                            {/* Contract Info */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <History />
                                        Contract Information
                                    </Typography>

                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Created
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(contract.created_at).toLocaleString()}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Last Updated
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(contract.updated_at).toLocaleString()}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Contract ID
                                            </Typography>
                                            <Typography variant="body2">
                                                #{contract.id}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Actions
                                    </Typography>

                                    <Stack spacing={2}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Send />}
                                            fullWidth
                                            disabled={status === 'draft'}
                                        >
                                            Send to Client
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            startIcon={<Download />}
                                            fullWidth
                                        >
                                            Download PDF
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            startIcon={<Preview />}
                                            fullWidth
                                        >
                                            Full Preview
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Contract Templates */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Quick Templates
                                    </Typography>

                                    <Stack spacing={1}>
                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => setContent(content + '\n\nTERMS AND CONDITIONS:\n1. Payment terms\n2. Cancellation policy\n3. Service details\n')}
                                        >
                                            Add Terms & Conditions
                                        </Button>

                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => setContent(content + '\n\nPAYMENT SCHEDULE:\n- 50% deposit due upon signing\n- 50% balance due 30 days before event\n')}
                                        >
                                            Add Payment Schedule
                                        </Button>

                                        <Button
                                            variant="text"
                                            size="small"
                                            onClick={() => setContent(content + '\n\nCANCELLATION POLICY:\n- 60+ days: Full refund minus $100 admin fee\n- 30-59 days: 50% refund\n- Less than 30 days: No refund\n')}
                                        >
                                            Add Cancellation Policy
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
