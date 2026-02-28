'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Snackbar,
    Chip,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import {
    CheckCircle,
    Add,
    Edit,
    Phone,
    Assignment,
    Description,
    Gavel,
    Timeline,
    CalendarToday,
    Place,
    AttachMoney,
    Flag,
    Group,
    Schedule,
    Videocam,
    InfoOutlined,
    ExpandLess,
    ExpandMore,
    ContentCopy,
    Save,
    Send as SendIcon,
    Delete,
    Star,
    StarBorder,
    ArrowBack,
    ArrowForward,
} from '@mui/icons-material';
import { Inquiry, InquiryStatus, NeedsAssessmentSubmission } from '@/lib/types';
import {
    inquiriesService,
    proposalsService,
    estimatesService,
    contractsService,
    quotesService,
    activityLogsService,
    api
} from '@/lib/api';
import ProjectPhaseBar from '@/components/projects/ProjectPhaseBar';
import MeetingScheduler from './components/MeetingScheduler';
import LineItemEditor, { LineItem } from './components/LineItemEditor';
import { getCalendarApi } from '../../../calendar/services/calendarApi';
import { useAuth } from '@/app/providers/AuthProvider';

// Component prop interfaces
interface WorkflowCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
}

interface StepperProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onStepClick: (sectionId: string) => void;
}

interface NeedsAssessmentCardProps extends WorkflowCardProps {
    submission?: NeedsAssessmentSubmission | null;
}

// Styled Workflow Card
const WorkflowCard = ({ children, isActive, activeColor = '#3b82f6', sx = {} }: any) => (
    <Card sx={{
        background: 'rgba(16, 18, 22, 0.8)',
        borderRadius: 3,
        border: isActive ? `1px solid ${activeColor}` : '1px solid rgba(52, 58, 68, 0.3)',
        boxShadow: isActive ? `0 0 20px ${activeColor}15` : '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible', // Allow glow to spill out
        '&::before': isActive ? {
            content: '""',
            position: 'absolute',
            inset: -1,
            zIndex: -1,
            borderRadius: 3.5,
            background: `linear-gradient(135deg, ${activeColor}40, transparent 40%)`,
            filter: 'blur(10px)',
            opacity: 0.5
        } : {},
        ...sx
    }}>
        {children}
    </Card>
);

// Workflow phase definitions
const WORKFLOW_PHASES = [
    { 
        id: 'needs-assessment', 
        name: 'Needs Assessment', 
        icon: Assignment, 
        color: '#3b82f6', 
        description: 'Initial requirements gathering',
        tasks: ['Review Inquiry', 'Initial Contact', 'Assess Requirements']
    },
    { 
        id: 'estimates', 
        name: 'Estimates', 
        icon: AttachMoney, 
        color: '#10b981', 
        description: 'Financial estimation',
        tasks: ['Draft Estimate', 'Internal Review', 'Send Estimate']
    },
    { 
        id: 'calls', 
        name: 'Discovery Calls', 
        icon: Phone, 
        color: '#f59e0b', 
        description: 'Client meetings and discovery',
        tasks: ['Schedule Call', 'Conduct Discovery Call', 'Log Meeting Notes']
    },
    { 
        id: 'proposals', 
        name: 'Proposals', 
        icon: Description, 
        color: '#8b5cf6', 
        description: 'Project proposal creation',
        tasks: ['Draft Proposal', 'Select Assets', 'Send Proposal']
    },
    { 
        id: 'consultation', 
        name: 'Consultation', 
        icon: CalendarToday, 
        color: '#ec4899', 
        description: 'In-depth consultation',
        tasks: ['Prepare Agenda', 'Consultation Meeting', 'Post-Counsultation Summary']
    },
    { 
        id: 'quotes', 
        name: 'Quotes', 
        icon: AttachMoney, 
        color: '#ef4444', 
        description: 'Detailed quoting',
        tasks: ['Generate Quote', 'Review Terms', 'Send for Approval']
    },
    { 
        id: 'contracts', 
        name: 'Contracts', 
        icon: Gavel, 
        color: '#6366f1', 
        description: 'Legal agreements',
        tasks: ['Draft Contract', 'Legal Check', 'Send for Signature']
    },
    { 
        id: 'approval', 
        name: 'Client Approval', 
        icon: CheckCircle, 
        color: '#14b8a6', 
        description: 'Final sign-off',
        tasks: ['Verify Signature', 'Process Deposit', 'Project Kickoff']
    },
];

// Progress calculation helper
const calculateWorkflowProgress = (inquiry: Inquiry & { activity_logs?: unknown[] }) => {
    if (!inquiry?.workflow_status) return 0;

    const status = inquiry.workflow_status;
    let completedSteps = 0;
    const totalSteps = 8; // Updated to include quotes step

    // Check completion based on workflow_status and related data
    if (typeof status === 'object') {
        if (status.needsAssessment === 'completed') completedSteps++;
        if (status.discoveryCall === 'completed') completedSteps++;
        if (status.clientApproval === 'completed') completedSteps++;
    }
    if (inquiry.estimates && inquiry.estimates.length > 0) completedSteps++;
    if (inquiry.proposals && inquiry.proposals.length > 0) completedSteps++;
    if (inquiry.quotes && inquiry.quotes.length > 0) completedSteps++;
    if (inquiry.contracts && inquiry.contracts.length > 0) completedSteps++;
    if (inquiry.activity_logs && inquiry.activity_logs.length > 0) completedSteps++;

    return Math.round((completedSteps / totalSteps) * 100);
};

// WorkflowProgressBar Component - REMOVED
// WorkflowStepper Component - REMOVED

// NeedAssessmentCard Component placeholder comment here? No.

// NeedsAssessmentCard Component
// ContactDetailsCard Component
const ContactDetailsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Helper to hide temporary emails generated during quick-add
    const getDisplayEmail = (email?: string) => {
        if (!email) return '';
        if (email.startsWith('pending_') && email.endsWith('@temp.com')) return '';
        return email;
    };

    const [formData, setFormData] = useState({
        first_name: inquiry.contact?.first_name || '',
        last_name: inquiry.contact?.last_name || '',
        email: getDisplayEmail(inquiry.contact?.email),
        phone_number: inquiry.contact?.phone_number || ''
    });

    useEffect(() => {
        setFormData({
            first_name: inquiry.contact?.first_name || '',
            last_name: inquiry.contact?.last_name || '',
            email: getDisplayEmail(inquiry.contact?.email),
            phone_number: inquiry.contact?.phone_number || ''
        });
    }, [inquiry]);

    const handleSave = async () => {
        try {
            const payload: any = { ...formData };
            
            // If email is empty (hidden temp email or user cleared it), don't send it
            // because backend requires valid email format
            if (!payload.email) {
                delete payload.email;
            }

            await inquiriesService.update(inquiry.id, payload);
            setIsEditing(false);
            if (onRefresh) await onRefresh();
        } catch (error) {
            console.error('Failed to update contact details:', error);
            alert('Failed to update contact details');
        }
    };

    return (
        <WorkflowCard sx={{ mb: 3 }} isActive={false}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        Contact Details
                    </Typography>
                    <IconButton onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                        {isEditing ? <CheckCircle color="primary" /> : <Edit />}
                    </IconButton>
                </Box>
                <Stack spacing={2}>
                    {isEditing ? (
                        <>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="First Name"
                                        fullWidth
                                        size="small"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Last Name"
                                        fullWidth
                                        size="small"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                    />
                                </Grid>
                            </Grid>
                            <TextField
                                label="Email"
                                fullWidth
                                size="small"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                            <TextField
                                label="Phone"
                                fullWidth
                                size="small"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                            />
                        </>
                    ) : (
                        <>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                <Typography variant="body1">
                                    {(inquiry.contact?.first_name || inquiry.contact?.last_name) 
                                        ? `${inquiry.contact?.first_name || ''} ${inquiry.contact?.last_name || ''}`.trim() 
                                        : '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                <Typography variant="body1">{getDisplayEmail(inquiry.contact?.email) || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                <Typography variant="body1">{inquiry.contact?.phone_number || '-'}</Typography>
                            </Box>
                        </>
                    )}
                </Stack>
            </CardContent>
        </WorkflowCard>
    );
};

// NeedsAssessmentCard Component
const NeedsAssessmentCard: React.FC<NeedsAssessmentCardProps> = ({ inquiry, onRefresh, isActive, activeColor, submission }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        wedding_date: inquiry.event_date ? new Date(inquiry.event_date).toISOString().split('T')[0] : '',
        venue_details: inquiry.venue_details || '',
        lead_source: inquiry.lead_source || '',
        lead_source_details: inquiry.lead_source_details || '',
        notes: inquiry.notes || '',
        selected_package_id: inquiry.selected_package_id || ''
    });

    useEffect(() => {
        // Load packages
        if (inquiry.brand_id) {
            api.servicePackages.getAll(inquiry.brand_id).then(setAvailablePackages).catch(console.error);
        }
    }, [inquiry.brand_id]);

    useEffect(() => {
        setFormData({
            wedding_date: inquiry.event_date ? new Date(inquiry.event_date).toISOString().split('T')[0] : '',
            venue_details: inquiry.venue_details || '',
            lead_source: inquiry.lead_source || '',
            lead_source_details: inquiry.lead_source_details || '',
            notes: inquiry.notes || '',
            selected_package_id: inquiry.selected_package_id || ''
        });
    }, [inquiry]);

    const handleSave = async () => {
        try {
            // Filter out empty date strings to prevent validation errors
            const payload: any = { ...formData };
            if (!payload.wedding_date) {
                delete payload.wedding_date;
            }
            
            // Handle package selection (convert empty string to null for clearing)
            if (!payload.selected_package_id) {
                payload.selected_package_id = null;
            } else {
                payload.selected_package_id = Number(payload.selected_package_id);
            }

            await inquiriesService.update(inquiry.id, payload);
            setIsEditing(false);
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error('Failed to update needs assessment:', error);
            alert(`Failed to update needs assessment: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment />
                        Needs Assessment
                        </Typography>
                        {submission && (
                            <Chip
                                label={`Submission: ${submission.status}`}
                                size="small"
                                color={submission.status === 'linked' ? 'success' : 'default'}
                                variant="outlined"
                            />
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        {submission ? (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => window.open(`/sales/inquiries/${inquiry.id}/needs-assessment`, '_blank')}
                            >
                                Review Questionnaire
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => window.open('/sales/needs-assessment', '_blank')}
                            >
                                Send Questionnaire Link
                            </Button>
                        )}
                        <IconButton onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                            {isEditing ? <CheckCircle color="primary" /> : <Edit />}
                        </IconButton>
                    </Stack>
                </Box>
                <Stack spacing={2}>
                    {isEditing ? (
                        <>
                            <TextField
                                label="Wedding Date"
                                type="date"
                                fullWidth
                                size="small"
                                value={formData.wedding_date}
                                onChange={(e) => setFormData({...formData, wedding_date: e.target.value})}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Venue Details"
                                fullWidth
                                multiline
                                rows={2}
                                size="small"
                                value={formData.venue_details}
                                onChange={(e) => setFormData({...formData, venue_details: e.target.value})}
                            />
                            <TextField
                                label="Lead Source"
                                fullWidth
                                size="small"
                                value={formData.lead_source}
                                onChange={(e) => setFormData({...formData, lead_source: e.target.value})}
                            />
                            <TextField
                                label="Lead Source Details"
                                fullWidth
                                size="small"
                                value={formData.lead_source_details}
                                onChange={(e) => setFormData({...formData, lead_source_details: e.target.value})}
                            />
                            {submission?.responses ? (() => {
                                const responseData = submission.responses as Record<string, any>;
                                const firstName = responseData.contact_first_name || inquiry.contact?.first_name;
                                const lastName = responseData.contact_last_name || inquiry.contact?.last_name;
                                const email = responseData.contact_email || inquiry.contact?.email;
                                const phone = responseData.contact_phone || inquiry.contact?.phone_number;
                                return (
                                    <>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                            <Typography variant="body1">
                                                {(firstName || lastName)
                                                    ? `${firstName || ''} ${lastName || ''}`.trim()
                                                    : '-'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                            <Typography variant="body1">{getDisplayEmail(email) || '-'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                            <Typography variant="body1">{phone || '-'}</Typography>
                                        </Box>
                                    </>
                                );
                            })() : (
                                <>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                        <Typography variant="body1">
                                            {(inquiry.contact?.first_name || inquiry.contact?.last_name) 
                                                ? `${inquiry.contact?.first_name || ''} ${inquiry.contact?.last_name || ''}`.trim() 
                                                : '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                        <Typography variant="body1">{getDisplayEmail(inquiry.contact?.email) || '-'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                        <Typography variant="body1">{inquiry.contact?.phone_number || '-'}</Typography>
                                    </Box>
                                </>
                            )}

                            <TextField
                                label="Notes"
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </>
                    ) : (
                        <Grid container spacing={3}>
                            {/* Column 1: Sales & Event Metrics */}
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    {/* Sales Summary Section */}
                                    <Box>
                                        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                            <AttachMoney fontSize="small" /> Sales Summary
                                        </Typography>
                                        {submission?.responses ? (() => {
                                            const data = submission.responses as Record<string, any>;
                                            return (
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>PRIORITY</Typography>
                                                            <Chip 
                                                                label={data.priority_level || 'Not set'} 
                                                                size="small" 
                                                                color={
                                                                    data.priority_level === 'High' ? 'error' : 
                                                                    data.priority_level === 'Medium' ? 'warning' : 'default'
                                                                }
                                                                variant={data.priority_level ? 'filled' : 'outlined'}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>BUDGET</Typography>
                                                            <Typography variant="body2" fontWeight={600}>{data.budget_range || '-'}</Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>CONTACT</Typography>
                                                            <Typography variant="body2">{data.preferred_contact_method || '-'}</Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>TIMELINE</Typography>
                                                            <Typography variant="body2">{data.decision_timeline || '-'}</Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            );
                                        })() : (
                                            <Typography variant="body2" color="text.secondary" fontStyle="italic">No questionnaire data yet.</Typography>
                                        )}
                                    </Box>

                                    <Divider />

                                    {/* Event Details Section */}
                                    <Box>
                                        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                            <Place fontSize="small" /> Event Details
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                                                    <CalendarToday fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
                                                    <Typography variant="body2">
                                                        {inquiry.event_date ? new Date(inquiry.event_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                    <Place fontSize="small" color="action" sx={{ fontSize: '1rem', mt: 0.5 }} />
                                                    <Typography variant="body2">{inquiry.venue_details || 'Venue not specified'}</Typography>
                                                </Box>
                                                {submission?.responses && (() => {
                                                    const data = submission.responses as Record<string, any>;
                                                    const stakeholders = data.stakeholders || '';
                                                    const flexibility = data.budget_flexible || '';
                                                    return (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Grid container spacing={2}>
                                                                <Grid item xs={12} sm={6}>
                                                                    <Box>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>FLEXIBILITY</Typography>
                                                                        <Typography variant="body2">{flexibility || '-'}</Typography>
                                                                    </Box>
                                                                </Grid>
                                                                <Grid item xs={12} sm={6}>
                                                                    <Box>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>STAKEHOLDERS</Typography>
                                                                        <Typography variant="body2">{stakeholders || '-'}</Typography>
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    );
                                                })()}
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Stack>
                            </Grid>

                            {/* Column 2: Scope & Technical */}
                            <Grid item xs={12} md={6}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                                            <Videocam fontSize="small" /> Scope & Package
                                        </Typography>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>SELECTED PACKAGE</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {availablePackages.find(p => p.id === Number(inquiry.selected_package_id))?.name || 'None selected'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {submission?.responses && (() => {
                                            const data = submission.responses as Record<string, any>;
                                            return (
                                                <Box sx={{ mt: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <Box>
                                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>COVERAGE</Typography>
                                                           <Typography variant="body2">{data.coverage_hours || '-'}</Typography>
                                                        </Box>
                                                    </Box>
                                                    
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>DELIVERABLES</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                        {(data.deliverables || []).length > 0 ? (
                                                            (data.deliverables as string[]).map((d, i) => (
                                                                <Chip key={i} label={d.trim()} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                                                            ))
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                                        )}
                                                    </Box>

                                                     <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, mt: 2 }}>ADD-ONS</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                        {(data.add_ons || []).length > 0 ? (
                                                            (data.add_ons as string[]).map((d, i) => (
                                                                <Chip key={i} label={d.trim()} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                                                            ))
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })()}
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <InfoOutlined fontSize="small" /> Additional Info
                                        </Typography>
                                        <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>LEAD SOURCE</Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                {inquiry.lead_source || 'Unknown'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>DETAILS</Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                {inquiry.lead_source_details || 'Not provided'}
                                            </Typography>
                                            
                                            {inquiry.notes && (
                                                <>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>NOTES</Typography>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>"{inquiry.notes}"</Typography>
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                </Stack>
            </CardContent>
        </WorkflowCard>
    );
};

// EstimatesCard Component
// EstimatesCard Component
const EstimatesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [estimates, setEstimates] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<any>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    
    // Financial State
    const [taxRate, setTaxRate] = useState<number>(0);
    const [depositRequired, setDepositRequired] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
    const [installments, setInstallments] = useState<number>(1);

    // Accordion state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    // Ref to track which ID we want to auto-expand after a data refresh
    const autoExpandIdRef = useRef<number | null>(null);

    // Auto-expand effect
    useEffect(() => {
        if (estimates.length > 0) {
            // Priority 1: Specifically requested ID (from create/update action)
            if (autoExpandIdRef.current) {
                const targetId = autoExpandIdRef.current;
                const exists = estimates.find(e => e.id === targetId);
                if (exists) {
                    setExpandedId(targetId);
                    autoExpandIdRef.current = null;
                    return;
                }
            }

            // Priority 2: Primary/Focused Estimate (Default view)
            // If nothing specifically requested, default to the focused one
            const primary = estimates.find((e: any) => e.is_primary);
            if (primary) {
                setExpandedId(primary.id);
            }
        }
    }, [estimates]);

    useEffect(() => {
        const fetchEstimates = async () => {
            if (inquiry?.id) {
                try {
                    const estimatesData = await estimatesService.getAllByInquiry(inquiry.id);
                    setEstimates(estimatesData || []);
                } catch (error) {
                    console.error('Error fetching estimates:', error);
                    setEstimates([]);
                }
            }
        };

        fetchEstimates();
    }, [inquiry?.id]);

    const handleCreate = async () => {
        setEditingEstimate(null);
        
        let initialItems: LineItem[] = [];

        // Auto-populate from selected package if available
        if (inquiry.selected_package_id && inquiry.brand_id) {
            try {
                const pkg = await api.servicePackages.getOne(inquiry.brand_id, inquiry.selected_package_id);
                if (pkg && pkg.contents && pkg.contents.items) {
                    initialItems = pkg.contents.items.map(pItem => ({
                        tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        description: pItem.description,
                        category: pItem.type === 'film' ? 'Videography' : 'Services',
                        quantity: 1,
                        unit: 'Qty',
                        unit_price: pItem.price,
                        total: pItem.price,
                        // Initialize empty optional fields
                        service_date: '',
                        start_time: '',
                        end_time: ''
                    }));
                }
            } catch (error) {
                console.error('Failed to load package details for estimate:', error);
                // Fallback to empty item handled below
            }
        }

        // Default empty item if no package items loaded
        if (initialItems.length === 0) {
            initialItems = [{ 
                tempId: `item-${Date.now()}`, 
                description: '', 
                quantity: 1, 
                unit: 'Qty', 
                unit_price: 0, 
                total: 0 
            }];
        }

        setLineItems(initialItems);
        setTaxRate(0);
        setDepositRequired(0);
        setPaymentMethod('Bank Transfer');
        setInstallments(1);
        setDialogOpen(true);
    };

    const handleEdit = (estimate: any) => {
        setEditingEstimate(estimate);
        // Map existing items to editor format
        const items = estimate.items?.map((item: any) => ({
            ...item,
            tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            service_date: item.service_date ? new Date(item.service_date).toISOString().split('T')[0] : (item.service_date || ''),
            start_time: item.start_time || '',
            end_time: item.end_time || '',
            category: item.category || '',
            unit: item.unit || 'Qty',
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: (Number(item.quantity) * Number(item.unit_price))
        })) || [];
        
        if (items.length === 0) {
           items.push({ 
               tempId: `item-${Date.now()}`,
               description: '', 
               quantity: 1, 
               unit: 'Qty', 
               unit_price: 0, 
               total: 0 
            });
        }
        
        setLineItems(items);
        setTaxRate(Number(estimate.tax_rate) || 0);
        setDepositRequired(Number(estimate.deposit_required) || 0);
        setPaymentMethod(estimate.payment_method || 'Bank Transfer');
        setInstallments(estimate.installments || 1);
        setDialogOpen(true);
    };

    const handleSave = async (statusOverride?: string) => {
        try {
            const currentStatus = typeof statusOverride === 'string' ? statusOverride : (editingEstimate?.status || 'Draft');
            
            // Construct payload from current form state
            const estimateData = {
                estimate_number: editingEstimate?.estimate_number || `EST-${Date.now()}`,
                title: editingEstimate?.title || undefined,
                issue_date: editingEstimate?.issue_date || new Date().toISOString().split('T')[0],
                expiry_date: editingEstimate?.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod, // Now supported by backend
                installments: installments,    // Now supported by backend
                status: currentStatus,
                notes: editingEstimate?.notes,
                terms: editingEstimate?.terms, // Ensure terms are preserved logic if needed
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price) 
                }))
            };

            let savedId: number | undefined;

            if (editingEstimate && editingEstimate.id) {
                // Typcasting explicit undefineds to null/undefined for backend strictness if needed
                await estimatesService.update(inquiry.id, editingEstimate.id, estimateData as any);
                savedId = editingEstimate.id;
            } else {
                const created = await estimatesService.create(inquiry.id, estimateData as any);
                savedId = created?.id;
            }

            setDialogOpen(false);

            try {
                // Set the ID to expand AFTER the estimates list updates
                if (savedId) {
                    autoExpandIdRef.current = Number(savedId);
                }

                // Fetch fresh list
                const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
                setEstimates(updatedEstimates || []);
                
                // Fallback: If we created new but didn't have ID, grab the last one
                if (!savedId && updatedEstimates && updatedEstimates.length > 0) {
                    const lastId = Number(updatedEstimates[updatedEstimates.length - 1].id);
                    autoExpandIdRef.current = lastId;
                }
            } catch (error) {
                console.error('Error refreshing estimates:', error);
            }

            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error('Error saving estimate:', error);
            alert(`Failed to save estimate: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDuplicate = async () => {
        try {
            const estimateData = {
                estimate_number: `EST-${Date.now()}`, // New number
                title: `${editingEstimate?.title || 'Estimate'} (Copy)`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments: installments,
                status: 'Draft', // Always draft for duplicate
                notes: editingEstimate?.notes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    service_date: item.service_date ? new Date(item.service_date) : undefined,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price) 
                }))
            };

            const created = await estimatesService.create(inquiry.id, estimateData as any);
            setDialogOpen(false);
            
            if (created?.id) {
                autoExpandIdRef.current = Number(created.id);
            }
            
            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);
            
            if (onRefresh) await onRefresh();

        } catch (error: any) {
            console.error('Error duplicating estimate:', error);
            alert(`Failed to duplicate: ${error.message}`);
        }
    };

    const handleDelete = async (estimateId: number) => {
        if (!confirm('Are you sure you want to delete this estimate? This action cannot be undone.')) return;
        try {
            // Assuming delete method exists on service, otherwise we need to add it or use raw fetch
            await estimatesService.delete(inquiry.id, estimateId);
            setDialogOpen(false);
            
            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);
            
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error('Error deleting estimate:', error);
            alert(`Failed to delete: ${error.message || 'Unknown error'}`);
        }
    };

    const handleSetFocus = async (estimateId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await estimatesService.update(inquiry.id, estimateId, { is_primary: true } as any);
            
            const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
            setEstimates(updatedEstimates || []);
            
            setExpandedId(estimateId);
        } catch (error: any) {
            console.error('Error setting focus:', error);
            alert(`Failed to set focus: ${error.message || 'Unknown error'}`);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Calculation Helpers
    const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * (taxRate / 100));
    const totalAmount = subtotal + taxAmount;
    const remainingAfterDeposit = Math.max(0, totalAmount - depositRequired);
    const installmentAmount = installments > 0 ? remainingAfterDeposit / installments : 0;

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoney />
                            Estimates
                        </Typography>
                        <Button startIcon={<Add />} onClick={handleCreate}>
                            Create Estimate
                        </Button>
                    </Box>

                    {estimates.length === 0 ? (
                        <Typography color="text.secondary">No estimates created yet</Typography>
                    ) : (
                        <Stack spacing={2}>
                            {estimates.map((estimate) => (
                                <Card key={estimate.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Box 
                                        sx={{ 
                                            p: 2, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            bgcolor: 'action.hover',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleExpand(estimate.id)}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                                {estimate.title || `Estimate #${estimate.estimate_number}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(estimate.issue_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tooltip title={(estimate as any).is_primary ? "Primary Estimate" : "Set as Primary"}>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleSetFocus(estimate.id, e)} 
                                                    color={(estimate as any).is_primary ? "warning" : "default"}
                                                >
                                                    {(estimate as any).is_primary ? <Star /> : <StarBorder />}
                                                </IconButton>
                                            </Tooltip>

                                            <Chip 
                                                label={estimate.status} 
                                                size="small" 
                                                color={estimate.status === 'Accepted' ? 'success' : 'default'} 
                                            />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                ${Number(estimate.total_amount || 0).toLocaleString()}
                                            </Typography>
                                            
                                            <Tooltip title="Delete Estimate">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(estimate.id); }} 
                                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Edit Estimate">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(estimate); }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            <IconButton size="small">
                                                {expandedId === estimate.id ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    
                                    <Collapse in={expandedId === estimate.id}>
                                        <Box sx={{ p: 2 }}>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Description</TableCell>
                                                            <TableCell align="right">Rate</TableCell>
                                                            <TableCell align="right">Qty</TableCell>
                                                            <TableCell align="right">Total</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {estimate.items?.map((item: any, idx: number) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>
                                                                    <Typography variant="body2">{item.description}</Typography>
                                                                    {item.category && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {item.category}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                                                <TableCell align="right">
                                                                    {item.quantity} {item.unit}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {Number(estimate.tax_rate) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right">Tax ({Number(estimate.tax_rate)}%)</TableCell>
                                                                <TableCell align="right">
                                                                    ${(Number(estimate.total_amount) - (Number(estimate.total_amount) / (1 + Number(estimate.tax_rate)/100))).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                                ${Number(estimate.total_amount).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                        {Number(estimate.deposit_required) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right" sx={{ color: 'text.secondary' }}>Deposit Required</TableCell>
                                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                                    ${Number(estimate.deposit_required).toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            
                                            {(estimate.notes || estimate.terms) && (
                                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                    {estimate.notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>NOTES</Typography>
                                                            <Typography variant="body2">{estimate.notes}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </WorkflowCard>

            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                maxWidth="xl" 
                fullWidth
                PaperProps={{
                    sx: { maxHeight: '85vh', height: 'auto', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            {editingEstimate?.id ? 'Edit Estimate' : 'Estimate Builder'}
                        </Typography>
                        {editingEstimate?.status && (
                             <Chip 
                                label={editingEstimate.status} 
                                size="small" 
                                color={editingEstimate.status === 'Sent' ? 'success' : 'default'} 
                                variant="outlined"
                             />
                        )}
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)}>
                        <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, minHeight: '50vh', flex: 1, overflow: 'hidden' }}>
                    {/* Main Content - Editor */}
                    <Box sx={{ flex: 1, p: 3, bgcolor: 'background.paper', overflowY: 'auto' }}>
                        <TextField
                            label="Title / Reference"
                            placeholder='e.g. "Full Day Wedding Coverage"'
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 4 }}
                            value={editingEstimate?.title || ''}
                            onChange={(e) => setEditingEstimate({...editingEstimate, title: e.target.value})}
                        />
                        
                        <LineItemEditor 
                            items={lineItems}
                            onChange={setLineItems}
                        />

                        <Box sx={{ mt: 6 }}>
                             <Typography variant="subtitle2" gutterBottom>Internal Notes & Payment Instructions</Typography>
                             <TextField
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Add notes about specific requirements, payment terms, etc..."
                                value={editingEstimate?.notes || ''}
                                onChange={(e) => setEditingEstimate({...editingEstimate, notes: e.target.value})}
                                sx={{ bgcolor: 'action.hover' }}
                            />
                        </Box>
                    </Box>

                    {/* Sidebar - Financial Summary */}
                    <Box sx={{ 
                        width: { xs: '100%', lg: 380 }, 
                        borderLeft: { lg: 1 }, 
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        p: 3,
                        overflowY: 'auto'
                    }}>
                        <Box sx={{ position: 'sticky', top: 0 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold" color="text.primary">
                                Financial Summary
                            </Typography>
                            
                            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography variant="subtitle1">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography color="text.secondary">Tax</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
                                        <TextField 
                                            size="small" 
                                            type="number"
                                            value={taxRate} 
                                            onChange={(e) => setTaxRate(Number(e.target.value))}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                sx: { py: 0 }
                                            }}
                                            sx={{ '& input': { py: 0.5 } }}
                                        />
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                            </Paper>

                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Payment Breakdown</Typography>
                            
                            <Stack spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                         value={paymentMethod}
                                         label="Payment Method"
                                         onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                                        <MenuItem value="Cash">Cash</MenuItem>
                                        <MenuItem value="Check">Check</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Required Deposit"
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={depositRequired}
                                    onChange={(e) => setDepositRequired(Number(e.target.value))}
                                    InputProps={{ 
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Installments:</Typography>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={installments}
                                        onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
                                        sx={{ width: 80 }}
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                </Box>

                                {installments > 0 && (
                                    <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Deposit</Typography>
                                            <Typography variant="body2" fontWeight="medium">${depositRequired.toLocaleString()}</Typography>
                                        </Box>
                                        {remainingAfterDeposit > 0 && Array.from({ length: installments }).map((_, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pl: 1, borderLeft: 2, borderColor: 'primary.main' }}>
                                                <Typography variant="body2" color="text.secondary">Payment {idx + 1}</Typography>
                                                <Typography variant="body2" fontWeight="medium">${installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                    {editingEstimate?.id && (
                        <>
                            <Button 
                                onClick={handleDuplicate} 
                                startIcon={<ContentCopy />}
                                color="inherit"
                            >
                                Duplicate
                            </Button>
                            <Button
                                onClick={() => handleDelete(editingEstimate.id)}
                                startIcon={<Delete />}
                                color="error"
                            >
                                Delete
                            </Button>
                             {!(editingEstimate as any).is_primary && (
                                <Button
                                    onClick={(e) => handleSetFocus(editingEstimate.id, e)}
                                    startIcon={<StarBorder />}
                                    color="warning" 
                                >
                                    Make Primary
                                </Button>
                            )}
                            {(editingEstimate as any).is_primary && (
                                <Chip 
                                    icon={<Star style={{ color: 'inherit' }} />} 
                                    label="Primary" 
                                    color="warning" 
                                    variant="outlined" 
                                    sx={{ alignSelf: 'center' }}
                                />
                            )}
                        </>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => handleSave('Draft')} 
                        variant="outlined" 
                        startIcon={<Save />}
                    >
                        Save Draft
                    </Button>
                    <Button 
                        onClick={() => handleSave('Sent')} 
                        variant="contained" 
                        endIcon={<SendIcon />}
                        color="primary"
                    >
                        Send Estimate
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};


// ProposalsCard Component
const ProposalsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [proposals, setProposals] = useState<any[]>([]);

    useEffect(() => {
        const fetchProposals = async () => {
            if (inquiry?.id) {
                try {
                    const proposalsData = await proposalsService.getAllByInquiry(inquiry.id);
                    setProposals(proposalsData || []);
                } catch (error) {
                    console.error('Error fetching proposals:', error);
                    setProposals([]);
                }
            }
        };

        fetchProposals();
    }, [inquiry?.id]);

    const handleCreate = async () => {
        try {
            const newProposal = await proposalsService.create(inquiry.id, {
                title: `Proposal for ${inquiry.contact?.first_name} ${inquiry.contact?.last_name}`,
                content: { blocks: [] }
            });

            // Refresh the proposals list
            try {
                const updatedProposals = await proposalsService.getAllByInquiry(inquiry.id);
                setProposals(updatedProposals || []);
            } catch (error) {
                console.error('Error refreshing proposals:', error);
            }

            if (onRefresh) onRefresh();

            // Navigate to the new proposal
            if (newProposal?.id) {
                window.open(`/inquiries/${inquiry.id}/proposals/${newProposal.id}`, '_blank');
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        Proposals
                    </Typography>
                    <Button startIcon={<Add />} onClick={handleCreate}>
                        Create Proposal
                    </Button>
                </Box>

                {proposals.length === 0 ? (
                    <Typography color="text.secondary">No proposals created yet</Typography>
                ) : (
                    <List>
                        {proposals.map((proposal: { id: number; title: string; status: string; version: number }) => (
                            <ListItem key={proposal.id} divider>
                                <ListItemText
                                    primary={proposal.title}
                                    secondary={`Status: ${proposal.status} - Version: ${proposal.version}`}
                                />
                                <IconButton
                                    onClick={() => window.open(`/inquiries/${inquiry.id}/proposals/${proposal.id}`, '_blank')}
                                    title="Edit proposal"
                                >
                                    <Edit />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

// QuotesCard Component
const QuotesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    // Existing State
    const [quotes, setQuotes] = useState<any[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const autoExpandIdRef = useRef<number | null>(null);

    // Dialog & editor state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<any>(null);
    
    // Import Sources State
    const [availableEstimates, setAvailableEstimates] = useState<any[]>([]);
    const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');
    
    // Editor Form State
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [consultationNotes, setConsultationNotes] = useState('');
    const [taxRate, setTaxRate] = useState(0);
    const [depositRequired, setDepositRequired] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [installments, setInstallments] = useState(1);
    const [notes, setNotes] = useState('');

    const fetchEstimates = async () => {
        if (!inquiry?.id) return;
        try {
            const estimates = await estimatesService.getAllByInquiry(inquiry.id);
            setAvailableEstimates(estimates || []);
            return estimates;
        } catch (error) {
            console.error('Error fetching estimates for import:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchQuotes = async () => {
            if (inquiry?.id) {
                try {
                    const quotesData = await quotesService.getAllByInquiry(inquiry.id);
                    setQuotes(quotesData || []);

                     // Auto-expand logic
                    if (autoExpandIdRef.current) {
                        setExpandedId(autoExpandIdRef.current);
                        autoExpandIdRef.current = null;
                    } else if (quotesData && quotesData.length > 0) {
                        // Expand primary first, else first item if nothing expanded
                        const primary = quotesData.find((q: any) => q.is_primary);
                        if (primary) {
                            setExpandedId(primary.id);
                        } else if (!expandedId) {
                            setExpandedId(quotesData[0].id);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching quotes:', error);
                    setQuotes([]);
                }
            }
        };

        fetchQuotes();
    }, [inquiry?.id]);

    const handleApplyEstimate = (val: string | number) => {
        const estimateId = val?.toString() || '';

        if (!estimateId) {
            // Reset to blank state if "None" is selected
            setLineItems([{ 
                tempId: `item-${Date.now()}`, 
                description: '', 
                quantity: 1, 
                unit: 'Qty', 
                unit_price: 0, 
                total: 0 
            }]);
            setTaxRate(0);
            setDepositRequired(0);
            setPaymentMethod('Bank Transfer');
            setInstallments(1);
            setNotes('');
            // Only reset quoting title if we are in "Create" mode (not editing existing)
            // and we rely on the import to set the title.
            if (!editingQuote?.id) {
                 setEditingQuote((prev: any) => ({ ...prev, title: '' })); 
            }
            return;
        }

        const estimate = availableEstimates.find(e => e.id.toString() === estimateId);
        if (estimate) {
            // Map estimate items to quote items
            const newItems = estimate.items?.map((item: any) => ({
                tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                description: item.description || '',
                category: item.category || '',
                unit: item.unit || 'Qty',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
                total: (Number(item.quantity) * Number(item.unit_price)) 
            })) || [];

            setLineItems(newItems);
            setTaxRate(Number(estimate.tax_rate) || 0);
            setDepositRequired(Number(estimate.deposit_required) || 0);
            setPaymentMethod(estimate.payment_method || 'Bank Transfer');
            setInstallments(Number(estimate.installments) || 1);
            setNotes(estimate.notes || '');
            
            // Set title if editing a new quote
            if (!editingQuote?.id) {
                setEditingQuote((prev: any) => ({ ...prev, title: `Quote from ${estimate.title || 'Estimate'}` }));
            }
        }
    };

    const handleCreate = async () => {
        setEditingQuote(null);
        setLineItems([{ 
            tempId: `item-${Date.now()}`, 
            description: '', 
            quantity: 1, 
            unit: 'Qty', 
            unit_price: 0, 
            total: 0 
        }]);
        setConsultationNotes('');
        setNotes('');
        setTaxRate(0);
        setDepositRequired(0);
        setPaymentMethod('Bank Transfer');
        setInstallments(1);
        setSelectedEstimateId(''); // Reset selection
        setDialogOpen(true);

        // Fetch estimates and handle default selection
        const estimates = await fetchEstimates();
        if (estimates && estimates.length > 0) {
            const primaryEstimate = estimates.find((e: any) => e.is_primary);
            if (primaryEstimate) {
                // Introduce a small delay to ensure state updates from reset don't conflict
                setTimeout(() => {
                    setSelectedEstimateId(primaryEstimate.id.toString());
                    handleApplyEstimate(primaryEstimate.id.toString()); 
                    // Note: handleApplyEstimate depends on availableEstimates state, 
                    // but we just fetched them locally. Ideally we pass the estimate directly to a helper.
                    // Let's manually apply here or make handleApplyEstimate smarter.
                    
                    // Manual apply since state might be lagging
                    const newItems = primaryEstimate.items?.map((item: any) => ({
                        tempId: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        description: item.description || '',
                        category: item.category || '',
                        unit: item.unit || 'Qty',
                        quantity: Number(item.quantity) || 1,
                        unit_price: Number(item.unit_price) || 0,
                        total: (Number(item.quantity) * Number(item.unit_price)) 
                    })) || [];
        
                    setLineItems(newItems);
                    setTaxRate(Number(primaryEstimate.tax_rate) || 0);
                    setDepositRequired(Number(primaryEstimate.deposit_required) || 0);
                    setPaymentMethod(primaryEstimate.payment_method || 'Bank Transfer');
                    setInstallments(Number(primaryEstimate.installments) || 1);
                    setNotes(primaryEstimate.notes || '');
                    setEditingQuote({ title: `Quote from ${primaryEstimate.title || 'Estimate'}` });

                }, 100);
            }
        }
    };


    const handleEdit = (quote: any) => {
        setEditingQuote(quote);
        setConsultationNotes(quote.consultation_notes || '');
        setNotes(quote.notes || '');
        setTaxRate(Number(quote.tax_rate) || 0);
        setDepositRequired(Number(quote.deposit_required) || 0);
        setPaymentMethod(quote.payment_method || 'Bank Transfer');
        setInstallments(quote.installments || 1);
        
        // Map existing items to editor format
        const items = quote.items?.map((item: any) => ({
            ...item,
            tempId: `item-${item.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: item.description || '',
            category: item.category || '',
            unit: item.unit || 'Qty',
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: (Number(item.quantity) * Number(item.unit_price)) 
        })) || [];
        
        if (items.length === 0) {
           items.push({ 
               tempId: `item-${Date.now()}`,
               description: '', 
               quantity: 1, 
               unit: 'Qty', 
               unit_price: 0, 
               total: 0 
           });
        }
        
        setLineItems(items);
        setDialogOpen(true);
    };

    const handleDuplicate = async () => {
        try {
            const quoteData = {
                quote_number: `QUO-${Date.now()}`, 
                title: `${editingQuote?.title || 'Quote'} (Copy)`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments: installments,
                status: 'Draft',
                notes: notes,
                consultation_notes: consultationNotes,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price) 
                }))
            };

            const created = await quotesService.create(inquiry.id, quoteData as any);
            setDialogOpen(false);
            
            if (created?.id) {
                autoExpandIdRef.current = Number(created.id);
            }
            
            const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
            setQuotes(updatedQuotes || []);
            
            if (onRefresh) await onRefresh();

        } catch (error: any) {
            console.error('Error duplicating quote:', error);
            alert(`Failed to duplicate: ${error.message}`);
        }
    };

    const handleDelete = async (quoteId: number) => {
        if (!confirm('Are you sure you want to delete this quote? This action cannot be undone.')) return;
        try {
            // Assuming delete method exists or using raw fetch if not
            if (quotesService.delete) {
                 await quotesService.delete(inquiry.id, quoteId);
            } else if (quotesService.remove) {
                 await quotesService.remove(inquiry.id, quoteId);
            } else {
                console.error("Delete method not found on quotesService");
            }
           
            setDialogOpen(false);
            
            const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
            setQuotes(updatedQuotes || []);
            
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error('Error deleting quote:', error);
            alert(`Failed to delete: ${error.message || 'Unknown error'}`);
        }
    };

    const handleSetFocus = async (quoteId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await quotesService.update(inquiry.id, quoteId, { is_primary: true } as any);
            
            const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
            setQuotes(updatedQuotes || []);
            
            setExpandedId(quoteId);
        } catch (error: any) {
            console.error('Error setting focus:', error);
            alert(`Failed to set focus: ${error.message || 'Unknown error'}`);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleSave = async (statusOverride?: string) => {
        try {
            const statusToSave = statusOverride || editingQuote?.status || 'Draft';

            const quoteData = {
                quote_number: editingQuote?.quote_number || `QUO-${Date.now()}`,
                title: editingQuote?.title || 'New Quote',
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                consultation_notes: consultationNotes,
                notes: notes,
                status: statusToSave,
                tax_rate: taxRate,
                deposit_required: depositRequired,
                payment_method: paymentMethod,
                installments: installments,
                items: lineItems.map(item => ({
                    description: item.description,
                    category: item.category,
                    unit: item.unit,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price)
                }))
            };

            if (editingQuote && editingQuote.id) {
                await quotesService.update(inquiry.id, editingQuote.id, quoteData);
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                await quotesService.create(inquiry.id, quoteData);
            }

            setDialogOpen(false);

            try {
                const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
                setQuotes(updatedQuotes || []);
            } catch (error) {
                console.error('Error refreshing quotes:', error);
            }

            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error('Error saving quote:', error);
            alert(`Failed to save quote: ${error.message || 'Unknown error'}`);
        }
    }; 
    
    // Calculation Helpers
    const calculateSubtotal = () => lineItems.reduce((acc, item) => acc + (item.total || 0), 0);
    const subtotal = calculateSubtotal();
    const taxAmount = (subtotal * (taxRate / 100));
    const totalAmount = subtotal + taxAmount;
    const remainingAfterDeposit = Math.max(0, totalAmount - depositRequired);
    const installmentAmount = installments > 0 ? remainingAfterDeposit / installments : 0;

    return (
        <>
            <WorkflowCard isActive={isActive} activeColor={activeColor}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoney />
                            Quotes
                        </Typography>
                        <Button startIcon={<Add />} onClick={handleCreate}>
                            Create Quote
                        </Button>
                    </Box>

                    {quotes.length === 0 ? (
                        <Typography color="text.secondary">No quotes created yet</Typography>
                    ) : (
                        <Stack spacing={2}>
                            {quotes.map((quote) => (
                                <Card key={quote.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                                    <Box 
                                        sx={{ 
                                            p: 2, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            bgcolor: 'action.hover',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleExpand(quote.id)}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                                {quote.title || `Quote #${quote.quote_number}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(quote.issue_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tooltip title={(quote as any).is_primary ? "Primary Quote" : "Set as Primary"}>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleSetFocus(quote.id, e)} 
                                                    color={(quote as any).is_primary ? "warning" : "default"}
                                                >
                                                    {(quote as any).is_primary ? <Star /> : <StarBorder />}
                                                </IconButton>
                                            </Tooltip>

                                            <Chip 
                                                label={quote.status} 
                                                size="small" 
                                                color={quote.status === 'Accepted' ? 'success' : 'default'} 
                                            />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                ${Number(quote.total_amount || 0).toLocaleString()}
                                            </Typography>
                                            
                                            <Tooltip title="Delete Quote">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(quote.id); }} 
                                                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Edit Quote">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(quote); }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            <IconButton size="small">
                                                {expandedId === quote.id ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    
                                    <Collapse in={expandedId === quote.id}>
                                        <Box sx={{ p: 2 }}>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Description</TableCell>
                                                            <TableCell align="right">Rate</TableCell>
                                                            <TableCell align="right">Qty</TableCell>
                                                            <TableCell align="right">Total</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {quote.items?.map((item: any, idx: number) => (
                                                            <TableRow key={idx}>
                                                                <TableCell>
                                                                    <Typography variant="body2">{item.description}</Typography>
                                                                    {item.category && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {item.category}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                                                <TableCell align="right">
                                                                    {item.quantity} {item.unit}
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {Number(quote.tax_rate) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right">Tax ({Number(quote.tax_rate)}%)</TableCell>
                                                                <TableCell align="right">
                                                                    ${(Number(quote.total_amount) - (Number(quote.total_amount) / (1 + Number(quote.tax_rate)/100))).toFixed(2)}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                                ${Number(quote.total_amount).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                        {Number(quote.deposit_required) > 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={3} align="right" sx={{ color: 'text.secondary' }}>Deposit Required</TableCell>
                                                                <TableCell align="right" sx={{ color: 'text.secondary' }}>
                                                                    ${Number(quote.deposit_required).toLocaleString()}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            
                                            {(quote.notes || quote.terms || quote.consultation_notes) && (
                                                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                     {quote.consultation_notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>CONSULTATION NOTES</Typography>
                                                            <Typography variant="body2">{quote.consultation_notes}</Typography>
                                                        </Box>
                                                    )}
                                                    {quote.notes && (
                                                        <Box sx={{ mb: 1 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>NOTES</Typography>
                                                            <Typography variant="body2">{quote.notes}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Card>
                            ))}
                        </Stack>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Create detailed quotes based on consultation outcomes and proposal review
                    </Typography>
                </CardContent>
            </WorkflowCard>

            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                maxWidth="xl" 
                fullWidth
                PaperProps={{
                    sx: { maxHeight: '85vh', height: 'auto', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                            {editingQuote?.id ? 'Edit Quote' : 'Quote Builder'}
                        </Typography>
                        {editingQuote?.status && (
                             <Chip 
                                label={editingQuote.status} 
                                size="small" 
                                color={editingQuote.status === 'Sent' ? 'success' : 'default'} 
                                variant="outlined"
                             />
                        )}
                        {!editingQuote?.id && availableEstimates.length > 0 && (
                            <Box sx={{ ml: 2, minWidth: 250 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Import from Estimate...</InputLabel>
                                    <Select
                                        value={selectedEstimateId}
                                        label="Import from Estimate..."
                                        onChange={(e) => {
                                            setSelectedEstimateId(e.target.value);
                                            handleApplyEstimate(e.target.value);
                                        }}
                                        renderValue={(selected) => {
                                            const est = availableEstimates.find(e => e.id.toString() === selected.toString());
                                            if (!est) return <em>None (Start Blank)</em>;
                                            return (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {est.is_primary && <Star fontSize="small" color="warning" sx={{ mr: 1 }} />}
                                                    {est.title || `Estimate #${est.estimate_number}`}
                                                </Box>
                                            );
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>None (Start Blank)</em>
                                        </MenuItem>
                                        {availableEstimates.map(est => (
                                            <MenuItem key={est.id} value={est.id.toString()}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    {est.is_primary ? <Star fontSize="small" color="warning" /> : <Box sx={{ width: 20 }} />}
                                                    <Box sx={{ flex: 1 }}>
                                                        {est.title || `Estimate #${est.estimate_number}`}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ${Number(est.total_amount).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                    <IconButton onClick={() => setDialogOpen(false)}>
                        <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, minHeight: '50vh', flex: 1, overflow: 'hidden' }}>
                    {/* Main Content - Editor */}
                    <Box sx={{ flex: 1, p: 3, bgcolor: 'background.paper', overflowY: 'auto' }}>
                        <TextField
                            label="Title / Reference"
                            placeholder='e.g. "Full Day Wedding Coverage"'
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 4 }}
                            value={editingQuote?.title || ''}
                            onChange={(e) => setEditingQuote({...editingQuote, title: e.target.value})}
                        />
                        
                         <TextField
                            label="Consultation Notes"
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Key requirements from consultation..."
                            sx={{ mb: 3 }}
                        />

                        <LineItemEditor 
                            items={lineItems}
                            onChange={setLineItems}
                        />

                        <Box sx={{ mt: 6 }}>
                             <Typography variant="subtitle2" gutterBottom>Internal Notes & Payment Instructions</Typography>
                             <TextField
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Add notes about specific requirements, payment terms, etc..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                sx={{ bgcolor: 'action.hover' }}
                            />
                        </Box>
                    </Box>

                    {/* Sidebar - Financial Summary */}
                    <Box sx={{ 
                        width: { xs: '100%', lg: 380 }, 
                        borderLeft: { lg: 1 }, 
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        p: 3,
                        overflowY: 'auto'
                    }}>
                        <Box sx={{ position: 'sticky', top: 0 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold" color="text.primary">
                                Financial Summary
                            </Typography>
                            
                            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography variant="subtitle1">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography color="text.secondary">Tax</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: 100 }}>
                                        <TextField 
                                            size="small" 
                                            type="number"
                                            value={taxRate} 
                                            onChange={(e) => setTaxRate(Number(e.target.value))}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                sx: { py: 0 }
                                            }}
                                            sx={{ '& input': { py: 0.5 } }}
                                        />
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                                        ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                </Box>
                            </Paper>

                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Payment Breakdown</Typography>
                            
                            <Stack spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                         value={paymentMethod}
                                         label="Payment Method"
                                         onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                                        <MenuItem value="Cash">Cash</MenuItem>
                                        <MenuItem value="Check">Check</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Required Deposit"
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={depositRequired}
                                    onChange={(e) => setDepositRequired(Number(e.target.value))}
                                    InputProps={{ 
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Installments:</Typography>
                                    <TextField
                                        size="small"
                                        type="number"
                                        value={installments}
                                        onChange={(e) => setInstallments(Math.max(1, Number(e.target.value)))}
                                        sx={{ width: 80 }}
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                </Box>

                                {installments > 0 && (
                                    <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Deposit</Typography>
                                            <Typography variant="body2" fontWeight="medium">${depositRequired.toLocaleString()}</Typography>
                                        </Box>
                                        {remainingAfterDeposit > 0 && Array.from({ length: installments }).map((_, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pl: 1, borderLeft: 2, borderColor: 'primary.main' }}>
                                                <Typography variant="body2" color="text.secondary">Payment {idx + 1}</Typography>
                                                <Typography variant="body2" fontWeight="medium">${installmentAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                    {editingQuote?.id && (
                        <>
                            <Button 
                                onClick={handleDuplicate} 
                                startIcon={<ContentCopy />}
                                color="inherit"
                            >
                                Duplicate
                            </Button>
                            <Button
                                onClick={() => handleDelete(editingQuote.id)}
                                startIcon={<Delete />}
                                color="error"
                            >
                                Delete
                            </Button>
                             {!(editingQuote as any).is_primary && (
                                <Button
                                    onClick={(e) => handleSetFocus(editingQuote.id, e)}
                                    startIcon={<StarBorder />}
                                    color="warning" 
                                >
                                    Make Primary
                                </Button>
                            )}
                            {(editingQuote as any).is_primary && (
                                <Chip 
                                    icon={<Star style={{ color: 'inherit' }} />} 
                                    label="Primary" 
                                    color="warning" 
                                    variant="outlined" 
                                    sx={{ alignSelf: 'center' }}
                                />
                            )}
                        </>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={() => handleSave('Draft')} 
                        variant="outlined" 
                        startIcon={<Save />}
                    >
                        Save Draft
                    </Button>
                    <Button 
                        onClick={() => handleSave('Sent')} 
                        variant="contained" 
                        endIcon={<SendIcon />}
                        color="primary"
                    >
                        Send Quote
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

// ContractsCard Component
const ContractsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [contracts, setContracts] = useState<any[]>([]);

    useEffect(() => {
        const fetchContracts = async () => {
            if (inquiry?.id) {
                try {
                    const contractsData = await contractsService.getAllByInquiry(inquiry.id);
                    setContracts(contractsData || []);
                } catch (error) {
                    console.error('Error fetching contracts:', error);
                    setContracts([]);
                }
            }
        };

        fetchContracts();
    }, [inquiry?.id]);

    const handleCreate = async () => {
        try {
            const newContract = await contractsService.create(inquiry.id, {
                title: `Contract for ${inquiry.contact?.first_name} ${inquiry.contact?.last_name}`,
                content: { blocks: [] }
            });

            // Refresh the contracts list
            try {
                const updatedContracts = await contractsService.getAllByInquiry(inquiry.id);
                setContracts(updatedContracts || []);
            } catch (error) {
                console.error('Error refreshing contracts:', error);
            }

            if (onRefresh) onRefresh();

            // Navigate to the new contract
            if (newContract?.id) {
                window.open(`/inquiries/${inquiry.id}/contracts/${newContract.id}`, '_blank');
            }
        } catch (error) {
            console.error('Error creating contract:', error);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Gavel />
                        Contracts
                    </Typography>
                    <Button startIcon={<Add />} onClick={handleCreate}>
                        Create Contract
                    </Button>
                </Box>

                {contracts.length === 0 ? (
                    <Typography color="text.secondary">No contracts created yet</Typography>
                ) : (
                    <List>
                        {contracts.map((contract: { id: number; title: string; status: string }) => (
                            <ListItem key={contract.id} divider>
                                <ListItemText
                                    primary={contract.title}
                                    secondary={`Status: ${contract.status}`}
                                />
                                <IconButton
                                    onClick={() => window.open(`/inquiries/${inquiry.id}/contracts/${contract.id}`, '_blank')}
                                    title="Edit contract"
                                >
                                    <Edit />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </WorkflowCard>
    );
};

// CallsCard Component - Enhanced with MeetingScheduler
const CallsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load meetings for this inquiry
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                setIsLoading(true);
                const api = getCalendarApi();
                const events = await api.getEvents();
                // Filter events for this inquiry that are discovery calls only
                const inquiryMeetings = events.filter((event: any) =>
                    event.inquiry_id === inquiry.id &&
                    event.event_type === 'DISCOVERY_CALL'
                );
                setMeetings(inquiryMeetings);
            } catch (error) {
                console.error('Error fetching meetings:', error);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (inquiry?.id) {
            fetchMeetings();
        }
    }, [inquiry?.id]);

    const handleScheduleMeeting = async (meetingData: any) => {
        try {
            setIsLoading(true);
            const api = getCalendarApi();
            await api.createEvent({
                ...meetingData,
                // Force event type to DISCOVERY_CALL for calls card
                event_type: 'DISCOVERY_CALL',
                inquiry_id: inquiry.id,
                contributor_id: user?.id || 1
            });

            // Refresh meetings list
            const events = await api.getEvents();
            const inquiryMeetings = events.filter((event: any) =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'DISCOVERY_CALL'
            );
            setMeetings(inquiryMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateMeeting = async (meetingId: number, meetingData: any) => {
        try {
            setIsLoading(true);
            const api = getCalendarApi();
            await api.updateEvent(meetingId, {
                ...meetingData,
                // Convert frontend event type to backend format if provided
                ...(meetingData.event_type && { event_type: meetingData.event_type.toUpperCase() })
            });

            // Refresh meetings list
            const events = await api.getEvents();
            const inquiryMeetings = events.filter((event: any) =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'DISCOVERY_CALL'
            );
            setMeetings(inquiryMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating meeting:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMeeting = async (meetingId: number) => {
        try {
            setIsLoading(true);
            const api = getCalendarApi();
            await api.deleteEvent(meetingId);

            // Refresh meetings list
            const events = await api.getEvents();
            const inquiryMeetings = events.filter((event: any) =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'DISCOVERY_CALL'
            );
            setMeetings(inquiryMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting meeting:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Phone />
                    Discovery Calls
                </Typography>
                <MeetingScheduler
                    meetings={meetings}
                    onScheduleMeeting={handleScheduleMeeting}
                    onUpdateMeeting={handleUpdateMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                    isLoading={isLoading}
                    eventType="discovery_call"
                    defaultDurationMinutes={15}
                />
            </CardContent>
        </WorkflowCard>
    );
};

// ConsultationCard Component - Shows consultation-specific meetings
const ConsultationCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load consultation meetings for this inquiry
    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                setIsLoading(true);
                const api = getCalendarApi();
                const events = await api.getEvents();
                // Filter events for this inquiry that are consultations only
                const consultationMeetings = events.filter((event: any) =>
                    event.inquiry_id === inquiry.id &&
                    event.event_type === 'CONSULTATION'
                );
                setMeetings(consultationMeetings);
            } catch (error) {
                console.error('Error fetching consultations:', error);
                setMeetings([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (inquiry?.id) {
            fetchConsultations();
        }
    }, [inquiry?.id]);

    const handleScheduleMeeting = async (meetingData: any) => {
        try {
            setIsLoading(true);
            const api = getCalendarApi();
            // Force event type to consultation and convert to uppercase
            await api.createEvent({
                ...meetingData,
                event_type: 'CONSULTATION',
                inquiry_id: inquiry.id,
                contributor_id: user?.id || 1
            });

            // Refresh meetings list
            const events = await api.getEvents();
            const consultationMeetings = events.filter((event: any) =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'CONSULTATION'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error scheduling consultation:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateMeeting = async (meetingId: number, meetingData: any) => {
        try {
            setIsLoading(true);
            const api = getCalendarApi();
            await api.updateEvent(meetingId, {
                ...meetingData,
                // Ensure event type remains CONSULTATION for consultations
                event_type: 'CONSULTATION'
            });

            // Refresh meetings list
            const events = await api.getEvents();
            const consultationMeetings = events.filter((event: any) =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'CONSULTATION'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating consultation:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMeeting = async (meetingId: number) => {
        try {
            setIsLoading(true);
            const api = getCalendarApi();
            await api.deleteEvent(meetingId);

            // Refresh meetings list
            const events = await api.getEvents();
            const consultationMeetings = events.filter((event: any) =>
                event.inquiry_id === inquiry.id &&
                event.event_type === 'CONSULTATION'
            );
            setMeetings(consultationMeetings);

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting consultation:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CalendarToday />
                    Consultations
                </Typography>
                <MeetingScheduler
                    meetings={meetings}
                    onScheduleMeeting={handleScheduleMeeting}
                    onUpdateMeeting={handleUpdateMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                    isLoading={isLoading}
                    eventType="consultation"
                    defaultDurationMinutes={60}
                />
            </CardContent>
        </WorkflowCard>
    );
};

// ClientApprovalCard Component
const ClientApprovalCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [selectedDocument, setSelectedDocument] = useState('');

    const handleMarkApproved = async () => {
        try {
            await inquiriesService.update(inquiry.id, {
                status: InquiryStatus.WON,
            });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error updating approval:', error);
        }
    };

    return (
        <WorkflowCard isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle />
                    Client Approval
                </Typography>

                <Stack spacing={3}>
                    <FormControl fullWidth>
                        <InputLabel>Select Final Document</InputLabel>
                        <Select
                            value={selectedDocument}
                            onChange={(e) => setSelectedDocument(e.target.value)}
                        >
                            {inquiry?.proposals?.map((proposal: { id: number; title: string }) => (
                                <MenuItem key={`proposal-${proposal.id}`} value={`proposal-${proposal.id}`}>
                                    {proposal.title} (Proposal)
                                </MenuItem>
                            ))}
                            {inquiry?.estimates?.map((estimate: { id: number; estimate_number: string }) => (
                                <MenuItem key={`estimate-${estimate.id}`} value={`estimate-${estimate.id}`}>
                                    Estimate #{estimate.estimate_number}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleMarkApproved}
                        disabled={!selectedDocument}
                        fullWidth
                    >
                        Mark as Approved & Book Project
                    </Button>
                </Stack>
            </CardContent>
        </WorkflowCard>
    );
};

// ActivityLogCard Component
const ActivityLogCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh, isActive, activeColor }) => {
    const [noteText, setNoteText] = useState('');
    const [activities, setActivities] = useState<Array<{ id: number; description: string; created_at: string }>>([]);

    useEffect(() => {
        if (inquiry?.activity_logs) {
            setActivities((inquiry.activity_logs as any[]) || []);
        }
    }, [inquiry]);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;

        try {
            await activityLogsService.logNote(inquiry.id, noteText);
            setNoteText('');
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    return (
        <WorkflowCard sx={{ height: 'fit-content', minHeight: '600px' }} isActive={isActive} activeColor={activeColor}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline />
                    Activity Log
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        placeholder="Add a note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mb: 1 }}
                    />
                    <Button onClick={handleAddNote} disabled={!noteText.trim()}>
                        Add Note
                    </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <List dense sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {activities.length === 0 ? (
                        <Typography color="text.secondary">No activity recorded yet</Typography>
                    ) : (
                        activities.map((activity, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={activity.description}
                                    secondary={new Date(activity.created_at).toLocaleString()}
                                />
                            </ListItem>
                        ))
                    )}
                </List>
            </CardContent>
        </WorkflowCard>
    );
};

// Main InquiryDetailPage Component
export default function InquiryDetailPage() {
    const params = useParams();
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [needsAssessmentSubmission, setNeedsAssessmentSubmission] = useState<NeedsAssessmentSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

    const inquiryId = parseInt(params.id as string);

    useEffect(() => {
        loadInquiry();
    }, [inquiryId]);

    const loadInquiry = async () => {
        try {
            setLoading(true);
            const data = await inquiriesService.getById(inquiryId);
            setInquiry(data);

            try {
                const submissions = await api.needsAssessmentSubmissions.getByInquiryId(inquiryId);
                setNeedsAssessmentSubmission(submissions[0] || null);
            } catch (submissionError) {
                setNeedsAssessmentSubmission(null);
            }
        } catch (err) {
            console.error('Error loading inquiry:', err);
            setError('Failed to load inquiry details');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await loadInquiry();
        setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
    };

    const scrollToSection = (elementId: string) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%', px: 3, py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ width: '100%', px: 3, py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!inquiry) {
        return (
            <Box sx={{ width: '100%', px: 3, py: 4 }}>
                <Alert severity="warning">Inquiry not found</Alert>
            </Box>
        );
    }

    const workflowProgress = calculateWorkflowProgress(inquiry);
    const completedCount = Math.floor((workflowProgress / 100) * WORKFLOW_PHASES.length);
    const activeIndex = Math.min(completedCount, WORKFLOW_PHASES.length - 1);
    const currentPhase = WORKFLOW_PHASES[activeIndex].id;
    const currentPhaseData = WORKFLOW_PHASES[activeIndex];
    const IconComponent = currentPhaseData?.icon || Assignment;

    return (
        <Box sx={{ minHeight: '100vh', p: 3 }}>
            {/* --- HEADER --- */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f1f5f9' }} gutterBottom>
                    Inquiry - {inquiry.contact?.first_name} {inquiry.contact?.last_name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Manage the complete sales workflow from initial inquiry through to contract approval and project kickoff.
                </Typography>
            </Box>

            {/* Current Phase and Task Overview */}
            <Box sx={{
                mt: 3,
                mb: 3
            }}>
                {/* Full Width Phase Overview */}
                <Box sx={{
                    background: 'rgba(16, 18, 22, 0.8)',
                    borderRadius: 3,
                    p: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(52, 58, 68, 0.3)',
                    width: '100%',
                    position: 'relative'
                }}>
                    {/* Progress Bar - Behind Icon */}
                    <Box sx={{
                        position: 'absolute',
                        top: '45%',
                        left: 0,
                        right: 0,
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                        px: 3,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '45%',
                            right: '45%',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(16, 18, 22, 0.9) 30%, rgba(16, 18, 22, 0.95) 50%, rgba(16, 18, 22, 0.9) 70%, transparent 100%)',
                            zIndex: 2,
                            pointerEvents: 'none'
                        }
                    }}>
                        <ProjectPhaseBar
                            phases={WORKFLOW_PHASES}
                            currentPhase={currentPhase}
                            onPhaseChange={() => {}}
                            projectId={inquiry.id}
                            title="Sales Progress"
                        />
                    </Box>

                    {/* Phase Header - Centered with Icon on Top */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 3,
                        position: 'relative',
                        zIndex: 3
                    }}>
                        <Box sx={{ textAlign: 'center' }}>
                            {/* Phase Icon - On Top of Progress Bar */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mb: 2
                            }}>
                                <Box sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${currentPhaseData?.color}20, ${currentPhaseData?.color}10)`,
                                    border: `2px solid ${currentPhaseData?.color}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 16px ${currentPhaseData?.color}20`,
                                    backgroundColor: 'rgba(16, 18, 22, 0.95)',
                                    position: 'relative',
                                    zIndex: 4
                                }}>
                                    <IconComponent sx={{ fontSize: 32, color: currentPhaseData?.color }} />
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: '0.1em' }}>
                                    Current Stage
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                                    {currentPhaseData?.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                                    {currentPhaseData?.description}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Tasks Row - Centered with Narrower Width */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 0,
                        position: 'relative',
                        zIndex: 3
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            maxWidth: '600px',
                            width: '100%'
                        }}>
                            {/* Previous Task */}
                            <Box sx={{
                                flex: '1',
                                textAlign: 'center',
                                opacity: 0.5,
                                transform: 'scale(0.9)'
                            }}>
                                <Typography variant="body2" sx={{
                                    fontWeight: 500,
                                    color: '#9ca3af',
                                    mb: 0.5
                                }}>
                                    Previous Task
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: '#6b7280',
                                    fontStyle: 'italic'
                                }}>
                                    {activeIndex > 0 ? WORKFLOW_PHASES[activeIndex - 1].tasks[WORKFLOW_PHASES[activeIndex - 1].tasks.length - 1] : 'Inquiry Received'}
                                </Typography>
                            </Box>

                            {/* Current Task - Wider */}
                            <Box sx={{
                                flex: '2.5',
                                textAlign: 'center'
                            }}>
                                <Box sx={{
                                    background: `rgba(${parseInt(currentPhaseData?.color.slice(1,3), 16)}, ${parseInt(currentPhaseData?.color.slice(3,5), 16)}, ${parseInt(currentPhaseData?.color.slice(5,7), 16)}, 0.1)`,
                                    border: `1px dashed ${currentPhaseData?.color}40`,
                                    borderRadius: 2,
                                    p: 1.5,
                                    minHeight: '50px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <Typography variant="body2" sx={{
                                        fontWeight: 600,
                                        color: currentPhaseData?.color,
                                        mb: 0.25
                                    }}>
                                        Current Task
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        color: '#94a3b8',
                                        fontStyle: 'italic'
                                    }}>
                                        {currentPhaseData?.tasks[0]}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Next Task */}
                            <Box sx={{
                                flex: '1',
                                textAlign: 'center',
                                opacity: 0.5,
                                transform: 'scale(0.9)'
                            }}>
                                <Typography variant="body2" sx={{
                                    fontWeight: 500,
                                    color: '#9ca3af',
                                    mb: 0.5
                                }}>
                                    Next Task
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: '#6b7280',
                                    fontStyle: 'italic'
                                }}>
                                    {activeIndex < WORKFLOW_PHASES.length - 1 ? WORKFLOW_PHASES[activeIndex + 1].tasks[0] : 'Project Kickoff'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* --- MAIN THREE-COLUMN WORKSPACE --- */}
            <Grid container spacing={3} sx={{ mt: 1 }}>

                {/* --- LEFT COLUMN (WIDER) --- */}
                <Grid item xs={12} md={5}>
                    <Stack spacing={3}>
                        <ContactDetailsCard inquiry={inquiry} onRefresh={handleRefresh} />
                        
                        <div id="needs-assessment-section">
                            <NeedsAssessmentCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh} 
                                isActive={currentPhase === 'needs-assessment'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'needs-assessment')?.color}
                                submission={needsAssessmentSubmission}
                            />
                        </div>
                        <div id="estimates-section">
                            <EstimatesCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'estimates'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'estimates')?.color}
                            />
                        </div>
                        <div id="calls-section">
                            <CallsCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'calls'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'calls')?.color}
                            />
                        </div>
                    </Stack>
                </Grid>

                {/* --- MIDDLE COLUMN --- */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <div id="proposals-section">
                            <ProposalsCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'proposals'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'proposals')?.color}
                            />
                        </div>
                        <div id="consultation-section">
                            <ConsultationCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'consultation'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'consultation')?.color}
                            />
                        </div>
                        <div id="quotes-section">
                            <QuotesCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'quotes'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'quotes')?.color}
                            />
                        </div>
                    </Stack>
                </Grid>

                {/* --- RIGHT COLUMN (THINNER) --- */}
                <Grid item xs={12} md={3}>
                    <Stack spacing={3}>
                        <div id="contracts-section">
                            <ContractsCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'contracts'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'contracts')?.color}
                            />
                        </div>
                        <div id="approval-section">
                            <ClientApprovalCard 
                                inquiry={inquiry} 
                                onRefresh={handleRefresh}
                                isActive={currentPhase === 'approval'}
                                activeColor={WORKFLOW_PHASES.find(p => p.id === 'approval')?.color}
                            />
                        </div>
                        <div id="activity-section">
                            <ActivityLogCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                    </Stack>
                </Grid>

            </Grid>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Box>
    );
}
