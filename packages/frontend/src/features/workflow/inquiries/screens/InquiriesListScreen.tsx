"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    Alert,
    Snackbar,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton,
    MenuItem,
    Select,
    FormControl,
} from '@mui/material';
import { StudioTable, type StudioColumn } from '@/shared/ui';
import { sectionColors } from '@/shared/theme/tokens';
import {
    Add as AddIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    Delete as DeleteIcon,
    Place as PlaceIcon,
    Search as SearchIcon,
    ViewList as ViewListIcon,
    ViewKanban as ViewKanbanIcon,
    CalendarToday,
    AttachMoney,
    AccessTime,
    Person as PersonIcon,
    Timeline as PipelineIcon,
    Event as EventIcon,
    Inventory2 as PackageIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { inquiriesApi } from '@/features/workflow/inquiries';
import { Inquiry, CreateInquiryData, InquiryStatus } from '@/features/workflow/inquiries/types';
import { useBrand } from '@/features/platform/brand';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { formatCurrency } from '@/shared/utils/formatUtils';

/* ------------------------------------------------------------------ */
/*  Pipeline stage definitions                                         */
/* ------------------------------------------------------------------ */

// Fallback stages used when inquiries have no task-based pipeline_stages
const LEGACY_PIPELINE_STAGES = [
    { key: 'New Lead',           color: '#22d3ee', bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.4)' },
    { key: 'Estimate Created',   color: '#94a3b8', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)' },
    { key: 'Estimate Sent',      color: '#60a5fa', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.4)' },
    { key: 'Estimate Accepted',  color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)' },
    { key: 'Proposal Sent',      color: '#a78bfa', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.4)' },
    { key: 'Contract Stage',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)' },
] as const;

/** Convert a hex color to an RGBA bg/border pair for chips. */
function hexToStageConfig(key: string, hex?: string | null) {
    const color = hex || '#94a3b8';
    return {
        key,
        color,
        bg: `${color}26`,    // ~15% opacity
        border: `${color}66`, // ~40% opacity
    };
}

/** Build dynamic stage config array from inquiries data (uses first inquiry's pipeline_stages, or fallback). */
function buildPipelineStages(inquiries: Inquiry[]) {
    // Find the first inquiry that has pipeline_stages defined
    const withStages = inquiries.find(i => i.pipeline_stages && i.pipeline_stages.length > 0);
    if (withStages?.pipeline_stages) {
        return withStages.pipeline_stages
            .sort((a, b) => a.order_index - b.order_index)
            .map(s => hexToStageConfig(s.name));
    }
    // Fallback to legacy hardcoded stages
    return [...LEGACY_PIPELINE_STAGES];
}

type PipelineStageKey = string;

const getStageConfig = (stage: string | null | undefined, stages: ReturnType<typeof hexToStageConfig>[]) => {
    const found = stages.find(s => s.key === stage);
    return found ?? stages[0] ?? LEGACY_PIPELINE_STAGES[0];
};

type SortOption = 'newest' | 'oldest' | 'event_date' | 'value_high' | 'value_low';

/* ================================================================== */
/*  InquiriesListScreen                                                */
/* ================================================================== */

export default function InquiriesListScreen() {
    const { currentBrand } = useBrand();
    const router = useRouter();

    /* ---- data state ---- */
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /* ---- filter / view state ---- */
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState<PipelineStageKey | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

    /* ---- notification state ---- */
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    /* ---- create state ---- */
    const [isCreating, setIsCreating] = useState(false);

    /* ---- delete dialog state ---- */
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ message, severity });
    };

    /* ---- handlers ---- */

    const handleInquiryClick = (inquiryId: number) => {
        router.push(`/inquiries/${inquiryId}`);
    };

    const handleDeleteClick = (e: React.MouseEvent, inquiry: Inquiry) => {
        e.stopPropagation();
        setInquiryToDelete(inquiry);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!inquiryToDelete) return;
        setIsDeleting(true);
        try {
            await inquiriesApi.delete(inquiryToDelete.id);
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

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            const newInquiryData: CreateInquiryData = {
                first_name: '',
                last_name: '',
                email: `pending_${Date.now()}@temp.com`,
                phone_number: '',
                wedding_date: new Date().toISOString(),
                status: InquiryStatus.NEW,
                notes: '',
                lead_source: '',
                lead_source_details: '',
                event_type_id: null,
            };
            const newInquiry = await inquiriesApi.create(newInquiryData);
            window.open(`/inquiry-wizard/preview?inquiry=${newInquiry.id}`, '_blank');
        } catch (error) {
            console.error('Failed to create inquiry:', error);
            showNotification('Failed to create inquiry', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    /* ---- data loading ---- */

    const loadInquiries = async () => {
        try {
            setIsLoading(true);
            const data = await inquiriesApi.getAll();
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

    /* ---- computed: filtered + sorted inquiries ---- */

    const filteredInquiries = useMemo(() => {
        let result = [...inquiries];

        // Search filter — matches name, email, phone, venue, package
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(inq => {
                const name = inq.contact?.full_name?.toLowerCase() ?? '';
                const email = inq.contact?.email?.toLowerCase() ?? '';
                const phone = inq.contact?.phone_number?.toLowerCase() ?? '';
                const venue = inq.venue_details?.toLowerCase() ?? '';
                const pkg = inq.selected_package?.name?.toLowerCase() ?? inq.package_contents_snapshot?.package_name?.toLowerCase() ?? '';
                return name.includes(q) || email.includes(q) || phone.includes(q) || venue.includes(q) || pkg.includes(q);
            });
        }

        // Stage filter
        if (stageFilter !== 'all') {
            result = result.filter(inq => (inq.pipeline_stage || 'New Lead') === stageFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'event_date': {
                    const aDate = a.event_date ? new Date(a.event_date).getTime() : Infinity;
                    const bDate = b.event_date ? new Date(b.event_date).getTime() : Infinity;
                    return aDate - bDate;
                }
                case 'value_high':
                    return (b.primary_quote_total ?? b.primary_estimate_total ?? 0) - (a.primary_quote_total ?? a.primary_estimate_total ?? 0);
                case 'value_low':
                    return (a.primary_quote_total ?? a.primary_estimate_total ?? 0) - (b.primary_quote_total ?? b.primary_estimate_total ?? 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [inquiries, searchQuery, stageFilter, sortBy]);

    /* ---- computed: stage counts (for pills) ---- */

    const stageCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const inq of inquiries) {
            const stage = inq.pipeline_stage || 'New Lead';
            counts[stage] = (counts[stage] || 0) + 1;
        }
        return counts;
    }, [inquiries]);

    /* ---- computed: dynamic pipeline stages ---- */

    const pipelineStages = useMemo(() => buildPipelineStages(inquiries), [inquiries]);

    /* ---- computed: kanban columns ---- */

    const kanbanColumns = useMemo(() => {
        return pipelineStages.map(stage => ({
            ...stage,
            inquiries: filteredInquiries.filter(inq => (inq.pipeline_stage || pipelineStages[0]?.key || 'New Lead') === stage.key),
        }));
    }, [filteredInquiries, pipelineStages]);

    /* ---- helpers ---- */

    const getInquiryPrice = (inquiry: Inquiry) => {
        const currency = currentBrand?.currency ?? DEFAULT_CURRENCY;
        // Prefer quote total (already includes tax from backend list endpoint)
        if (inquiry.primary_quote_total != null) {
            return { amount: inquiry.primary_quote_total, currency };
        }
        // Fall back to estimate total (already includes tax from backend list endpoint)
        if (inquiry.primary_estimate_total != null) {
            return { amount: inquiry.primary_estimate_total, currency };
        }
        return null;
    };

    const getDaysAgo = (date: Date) => {
        const diff = Date.now() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        return `${days}d ago`;
    };

    /* ================================================================== */
    /*  Render                                                             */
    /* ================================================================== */

    return (
        <Box sx={{ p: 3 }}>
            {/* ===== Header ===== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                        Inquiries
                    </Typography>
                    {!isLoading && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {inquiries.length} total{filteredInquiries.length !== inquiries.length ? ` · ${filteredInquiries.length} shown` : ''}
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ px: 3 }}
                >
                    New Inquiry
                </Button>
            </Box>

            {/* ===== Filter Toolbar ===== */}
            <Box sx={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2.5,
                p: 2, borderRadius: 2,
                bgcolor: 'rgba(16, 18, 24, 0.4)',
                border: '1px solid rgba(52, 58, 68, 0.2)',
            }}>
                {/* Search */}
                <TextField
                    size="small"
                    placeholder="Search name, email, venue, package..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ minWidth: 260, flex: 1, maxWidth: 400 }}
                />

                {/* Stage filter chips */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                        label={`All (${inquiries.length})`}
                        size="small"
                        variant={stageFilter === 'all' ? 'filled' : 'outlined'}
                        onClick={() => setStageFilter('all')}
                        sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            ...(stageFilter === 'all' ? { bgcolor: 'rgba(255,255,255,0.12)', color: '#f1f5f9' } : { color: 'text.secondary' }),
                        }}
                    />
                    {pipelineStages.map(stage => {
                        const count = stageCounts[stage.key] || 0;
                        if (count === 0) return null;
                        const isActive = stageFilter === stage.key;
                        return (
                            <Chip
                                key={stage.key}
                                label={`${stage.key} (${count})`}
                                size="small"
                                variant={isActive ? 'filled' : 'outlined'}
                                onClick={() => setStageFilter(isActive ? 'all' : stage.key)}
                                sx={{
                                    fontWeight: 600, fontSize: '0.7rem',
                                    ...(isActive
                                        ? { bgcolor: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }
                                        : { color: 'text.secondary', borderColor: 'rgba(52, 58, 68, 0.3)' }
                                    ),
                                }}
                            />
                        );
                    })}
                </Box>

                {/* Spacer */}
                <Box sx={{ flex: 1 }} />

                {/* Sort */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        sx={{ fontSize: '0.8rem' }}
                    >
                        <MenuItem value="newest">Newest first</MenuItem>
                        <MenuItem value="oldest">Oldest first</MenuItem>
                        <MenuItem value="event_date">Event date</MenuItem>
                        <MenuItem value="value_high">Value: high → low</MenuItem>
                        <MenuItem value="value_low">Value: low → high</MenuItem>
                    </Select>
                </FormControl>

                {/* View toggle */}
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                    size="small"
                >
                    <ToggleButton value="table">
                        <Tooltip title="Table view">
                            <ViewListIcon sx={{ fontSize: 18 }} />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="kanban">
                        <Tooltip title="Pipeline board">
                            <ViewKanbanIcon sx={{ fontSize: 18 }} />
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* ===== Content ===== */}
            {isLoading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">Loading inquiries...</Typography>
                </Box>
            ) : inquiries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>No inquiries found</Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleCreate}>
                        Create Your First Inquiry
                    </Button>
                </Box>
            ) : viewMode === 'table' ? (
                /* ============================================ */
                /*  TABLE VIEW                                   */
                /* ============================================ */
                <StudioTable
                    sectionColor={sectionColors.inquiries}
                    columns={[
                        {
                            key: 'contact',
                            label: 'Contact',
                            flex: 2,
                            headerIcon: <PersonIcon />,
                            render: (inquiry) => (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {inquiry.contact.full_name}
                                    </Typography>
                                    {inquiry.contact.email && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                            <EmailIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                                            <Typography variant="caption" color="text.secondary">{inquiry.contact.email}</Typography>
                                        </Box>
                                    )}
                                    {inquiry.contact.phone_number && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                            <PhoneIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                                            <Typography variant="caption" color="text.secondary">{inquiry.contact.phone_number}</Typography>
                                        </Box>
                                    )}
                                    {inquiry.contact.company_name && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                            <BusinessIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                                            <Typography variant="caption" color="text.secondary">{inquiry.contact.company_name}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            ),
                        },
                        {
                            key: 'pipeline_stage',
                            label: 'Pipeline Stage',
                            width: 150,
                            headerIcon: <PipelineIcon />,
                            render: (inquiry) => {
                                const stageConfig = getStageConfig(inquiry.pipeline_stage, pipelineStages);
                                return (
                                    <Chip
                                        label={inquiry.pipeline_stage || 'New Lead'}
                                        size="small"
                                        sx={{
                                            bgcolor: stageConfig.bg, color: stageConfig.color,
                                            border: `1px solid ${stageConfig.border}`,
                                            fontWeight: 600, fontSize: '0.7rem',
                                        }}
                                    />
                                );
                            },
                        },
                        {
                            key: 'event_date',
                            label: 'Event Date',
                            width: 120,
                            headerIcon: <EventIcon />,
                            render: (inquiry) => (
                                <Typography variant="body2" color={inquiry.event_date ? 'text.primary' : 'text.secondary'}>
                                    {inquiry.event_date ? new Date(inquiry.event_date).toLocaleDateString() : '-'}
                                </Typography>
                            ),
                        },
                        {
                            key: 'package',
                            label: 'Package',
                            flex: 1,
                            headerIcon: <PackageIcon />,
                            render: (inquiry) => (
                                <Typography variant="body2" color={inquiry.selected_package || inquiry.package_contents_snapshot?.package_name ? 'text.primary' : 'text.secondary'}>
                                    {inquiry.selected_package?.name || inquiry.package_contents_snapshot?.package_name || '-'}
                                </Typography>
                            ),
                        },
                        {
                            key: 'price',
                            label: 'Price',
                            width: 110,
                            headerIcon: <AttachMoney />,
                            render: (inquiry) => {
                                const packagePrice = getInquiryPrice(inquiry);
                                return (
                                    <Typography variant="body2" color={packagePrice ? 'text.primary' : 'text.secondary'}>
                                        {formatCurrency(packagePrice?.amount, packagePrice?.currency) || '-'}
                                    </Typography>
                                );
                            },
                        },
                        {
                            key: 'venue',
                            label: 'Venue',
                            flex: 1,
                            headerIcon: <PlaceIcon />,
                            render: (inquiry) =>
                                inquiry.venue_details ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PlaceIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                        <Typography variant="body2">{inquiry.venue_details}</Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                ),
                        },
                        {
                            key: 'created_at',
                            label: 'Date of Inquiry',
                            width: 120,
                            headerIcon: <AccessTime />,
                            render: (inquiry) => (
                                <Typography variant="body2">{new Date(inquiry.created_at).toLocaleDateString()}</Typography>
                            ),
                        },
                        {
                            key: 'actions',
                            label: '',
                            width: 60,
                            align: 'right',
                            render: (inquiry) => (
                                <Box onClick={e => e.stopPropagation()}>
                                    <Tooltip title="Delete inquiry">
                                        <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, inquiry)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ),
                        },
                    ] as StudioColumn<typeof filteredInquiries[number]>[]}
                    rows={filteredInquiries}
                    getRowKey={(inq) => inq.id}
                    onRowClick={(inq) => handleInquiryClick(inq.id)}
                    emptyMessage="No inquiries match your filters"
                />
            ) : (
                /* ============================================ */
                /*  KANBAN BOARD VIEW                            */
                /* ============================================ */
                <Box sx={{
                    display: 'flex', gap: 2, overflowX: 'auto', pb: 2,
                    minHeight: 'calc(100vh - 260px)',
                }}>
                    {kanbanColumns.map(column => (
                        <Box
                            key={column.key}
                            sx={{
                                minWidth: 280, maxWidth: 320, flex: '0 0 280px',
                                display: 'flex', flexDirection: 'column',
                                borderRadius: 2,
                                bgcolor: 'rgba(16, 18, 24, 0.5)',
                                border: '1px solid rgba(52, 58, 68, 0.2)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Column header */}
                            <Box sx={{
                                px: 2, py: 1.5,
                                borderBottom: `2px solid ${column.color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.color }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#e2e8f0' }}>
                                        {column.key}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={column.inquiries.length}
                                    size="small"
                                    sx={{
                                        height: 20, minWidth: 20,
                                        fontSize: '0.65rem', fontWeight: 800,
                                        bgcolor: `${column.color}15`, color: column.color,
                                        '& .MuiChip-label': { px: 0.75 },
                                    }}
                                />
                            </Box>

                            {/* Cards */}
                            <Box sx={{ flex: 1, overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {column.inquiries.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>No inquiries</Typography>
                                    </Box>
                                ) : (
                                    column.inquiries.map(inquiry => (
                                        <Box
                                            key={inquiry.id}
                                            onClick={() => handleInquiryClick(inquiry.id)}
                                            sx={{
                                                p: 1.5, borderRadius: 1.5, cursor: 'pointer',
                                                bgcolor: 'rgba(30, 34, 44, 0.7)',
                                                border: '1px solid rgba(52, 58, 68, 0.25)',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    bgcolor: 'rgba(40, 46, 58, 0.85)',
                                                    borderColor: `${column.color}40`,
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
                                                },
                                            }}
                                        >
                                            {/* Name */}
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#f1f5f9', mb: 0.5, lineHeight: 1.3 }}>
                                                {inquiry.contact.full_name || 'Unnamed'}
                                            </Typography>

                                            {/* Package */}
                                            {(inquiry.selected_package?.name || inquiry.package_contents_snapshot?.package_name) && (
                                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {inquiry.selected_package?.name || inquiry.package_contents_snapshot?.package_name}
                                                </Typography>
                                            )}

                                            {/* Meta row: event date, value, age */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                                {inquiry.event_date && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CalendarToday sx={{ fontSize: 11, color: '#64748b' }} />
                                                        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                                            {new Date(inquiry.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {(inquiry.primary_quote_total != null || inquiry.primary_estimate_total != null) && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <AttachMoney sx={{ fontSize: 11, color: '#10b981' }} />
                                                        <Typography sx={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>
                                                            {formatCurrency(inquiry.primary_quote_total ?? inquiry.primary_estimate_total, currentBrand?.currency)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                                                    <AccessTime sx={{ fontSize: 11, color: '#64748b' }} />
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                                                        {getDaysAgo(inquiry.created_at)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}



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
                    <Button onClick={handleDeleteCancel} disabled={isDeleting}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.severity || 'info'} sx={{ width: '100%' }}>
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
