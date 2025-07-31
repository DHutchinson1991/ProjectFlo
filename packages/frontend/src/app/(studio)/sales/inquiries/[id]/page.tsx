'use client';

import React, { useState, useEffect } from 'react';
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
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    StepButton,
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
    AttachMoney,
    CalendarToday,
} from '@mui/icons-material';
import { Inquiry, InquiryStatus } from '@/lib/types';
import {
    inquiriesService,
    proposalsService,
    estimatesService,
    contractsService,
    quotesService
} from '@/lib/api';
import MeetingScheduler from './components/MeetingScheduler';
import { getCalendarApi } from '../../../calendar/services/calendarApi';

// Component prop interfaces
interface WorkflowCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
}

interface StepperProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onStepClick: (sectionId: string) => void;
}

// Workflow step definitions
const WORKFLOW_STEPS = [
    { id: 'needs-assessment', label: 'Needs Assessment', icon: <Assignment /> },
    { id: 'estimates', label: 'Estimates', icon: <AttachMoney /> },
    { id: 'calls', label: 'Discovery Calls', icon: <Phone /> },
    { id: 'proposals', label: 'Proposals', icon: <Description /> },
    { id: 'consultation', label: 'Consultation', icon: <CalendarToday /> },
    { id: 'quotes', label: 'Quotes', icon: <AttachMoney /> },
    { id: 'contracts', label: 'Contracts', icon: <Gavel /> },
    { id: 'approval', label: 'Client Approval', icon: <CheckCircle /> },
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
    // TODO: Add quotes check when quotes API is implemented
    // if (inquiry.quotes && inquiry.quotes.length > 0) completedSteps++;
    if (inquiry.contracts && inquiry.contracts.length > 0) completedSteps++;
    if (inquiry.activity_logs && inquiry.activity_logs.length > 0) completedSteps++;

    return Math.round((completedSteps / totalSteps) * 100);
};

// WorkflowProgressBar Component
const WorkflowProgressBar: React.FC<WorkflowCardProps> = ({ inquiry }) => {
    const progress = calculateWorkflowProgress(inquiry);

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Workflow Progress</Typography>
                <Typography variant="body2" color="text.secondary">{progress}% Complete</Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
            />
        </Box>
    );
};

// WorkflowStepper Component
const WorkflowStepper: React.FC<StepperProps> = ({ inquiry, onStepClick }) => {
    const workflowProgress = calculateWorkflowProgress(inquiry);
    const currentStep = Math.floor(workflowProgress / (100 / WORKFLOW_STEPS.length));
    const [activeStep, setActiveStep] = useState(currentStep);

    const handleStepClick = (stepIndex: number, stepId: string) => {
        setActiveStep(stepIndex);
        onStepClick(`${stepId}-section`);
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {WORKFLOW_STEPS.map((step, index) => (
                    <Step key={step.id}>
                        <StepButton
                            onClick={() => handleStepClick(index, step.id)}
                            icon={step.icon}
                        >
                            <StepLabel>{step.label}</StepLabel>
                        </StepButton>
                    </Step>
                ))}
            </Stepper>
        </Paper>
    );
};

// NeedsAssessmentCard Component
const NeedsAssessmentCard: React.FC<WorkflowCardProps> = ({ inquiry }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Needs Assessment
                </Typography>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Event Details</Typography>
                        <Typography>Date: {inquiry?.event_date ? new Date(inquiry.event_date).toLocaleDateString() : 'Not set'}</Typography>
                        <Typography>Venue: {inquiry?.venue_details || 'Not specified'}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary">Lead Information</Typography>
                        <Typography>Source: {inquiry?.lead_source || 'Unknown'}</Typography>
                        {inquiry?.lead_source_details && (
                            <Typography>Details: {inquiry.lead_source_details}</Typography>
                        )}
                    </Box>
                    {inquiry?.notes && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Initial Notes</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {inquiry.notes}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

// EstimatesCard Component
const EstimatesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
    const [estimates, setEstimates] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEstimate, setEditingEstimate] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
    });

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

    const handleCreate = () => {
        setEditingEstimate(null);
        setFormData({ description: '', quantity: 1, unit_price: 0, total_amount: 0 });
        setDialogOpen(true);
    };

    const handleEdit = (estimate: { id: number; items?: Array<{ description?: string; quantity?: number; unit_price?: number }>; total_amount?: number }) => {
        setEditingEstimate(estimate);
        setFormData({
            description: estimate.items?.[0]?.description || '',
            quantity: estimate.items?.[0]?.quantity || 1,
            unit_price: estimate.items?.[0]?.unit_price || 0,
            total_amount: estimate.total_amount || 0,
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const estimateData = {
                estimate_number: `EST-${Date.now()}`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                total_amount: formData.total_amount,
                items: [{
                    description: formData.description,
                    quantity: formData.quantity,
                    unit_price: formData.unit_price,
                }]
            };

            if (editingEstimate) {
                await estimatesService.update(inquiry.id, editingEstimate.id, estimateData);
            } else {
                await estimatesService.create(inquiry.id, estimateData);
            }

            setDialogOpen(false);

            // Refresh the estimates list
            try {
                const updatedEstimates = await estimatesService.getAllByInquiry(inquiry.id);
                setEstimates(updatedEstimates || []);
            } catch (error) {
                console.error('Error refreshing estimates:', error);
            }

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error saving estimate:', error);
        }
    };

    return (
        <>
            <Card>
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
                        <List>
                            {estimates.map((estimate) => (
                                <ListItem key={estimate.id} divider>
                                    <ListItemText
                                        primary={`Estimate #${estimate.estimate_number}`}
                                        secondary={`Total: $${estimate.total_amount} - Status: ${estimate.status}`}
                                    />
                                    <IconButton onClick={() => handleEdit(estimate)}>
                                        <Edit />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEstimate ? 'Edit Estimate' : 'Create New Estimate'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <TextField
                            label="Quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                            fullWidth
                        />
                        <TextField
                            label="Unit Price"
                            type="number"
                            value={formData.unit_price}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                            fullWidth
                        />
                        <TextField
                            label="Total Amount"
                            type="number"
                            value={formData.total_amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ProposalsCard Component
const ProposalsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
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
        <Card>
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
        </Card>
    );
};

// QuotesCard Component
const QuotesCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
        consultation_notes: '',
    });

    useEffect(() => {
        const fetchQuotes = async () => {
            if (inquiry?.id) {
                try {
                    const quotesData = await quotesService.getAllByInquiry(inquiry.id);
                    setQuotes(quotesData || []);
                } catch (error) {
                    console.error('Error fetching quotes:', error);
                    setQuotes([]);
                }
            }
        };

        fetchQuotes();
    }, [inquiry?.id]);

    const handleCreate = () => {
        setEditingQuote(null);
        setFormData({
            description: 'Final quote based on consultation requirements',
            quantity: 1,
            unit_price: 0,
            total_amount: 0,
            consultation_notes: '',
        });
        setDialogOpen(true);
    };

    const handleEdit = (quote: { id: number; items?: Array<{ description?: string; quantity?: number; unit_price?: number }>; total_amount?: number; consultation_notes?: string }) => {
        setEditingQuote(quote);
        setFormData({
            description: quote.items?.[0]?.description || '',
            quantity: quote.items?.[0]?.quantity || 1,
            unit_price: quote.items?.[0]?.unit_price || 0,
            total_amount: quote.total_amount || 0,
            consultation_notes: quote.consultation_notes || '',
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const quoteData = {
                quote_number: `QUO-${Date.now()}`,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                consultation_notes: formData.consultation_notes,
                items: [{
                    description: formData.description,
                    quantity: formData.quantity,
                    unit_price: formData.unit_price,
                }]
            };

            if (editingQuote) {
                await quotesService.update(inquiry.id, editingQuote.id, quoteData);
            } else {
                await quotesService.create(inquiry.id, quoteData);
            }

            setDialogOpen(false);

            // Refresh the quotes list
            try {
                const updatedQuotes = await quotesService.getAllByInquiry(inquiry.id);
                setQuotes(updatedQuotes || []);
            } catch (error) {
                console.error('Error refreshing quotes:', error);
            }

            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error saving quote:', error);
        }
    }; return (
        <>
            <Card>
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
                        <List>
                            {quotes.map((quote: { id: number; quote_number: string; total_amount: number; status: string }) => (
                                <ListItem key={quote.id} divider>
                                    <ListItemText
                                        primary={quote.quote_number}
                                        secondary={`Total: $${quote.total_amount} - Status: ${quote.status}`}
                                    />
                                    <IconButton onClick={() => handleEdit(quote)}>
                                        <Edit />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Create detailed quotes based on consultation outcomes and proposal review
                    </Typography>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingQuote ? 'Edit Quote' : 'Create New Quote'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <TextField
                            label="Consultation Notes"
                            value={formData.consultation_notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, consultation_notes: e.target.value }))}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Key requirements from consultation..."
                        />
                        <TextField
                            label="Quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                            fullWidth
                        />
                        <TextField
                            label="Unit Price"
                            type="number"
                            value={formData.unit_price}
                            onChange={(e) => setFormData(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                            fullWidth
                        />
                        <TextField
                            label="Total Amount"
                            type="number"
                            value={formData.total_amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ContractsCard Component
const ContractsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
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
        <Card>
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
        </Card>
    );
};

// CallsCard Component - Enhanced with MeetingScheduler
const CallsCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
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
                // Use current user as assignee (you might want to get this from auth context)
                contributor_id: 1 // TODO: Get from auth context
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
        <Card>
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
        </Card>
    );
};

// ConsultationCard Component - Shows consultation-specific meetings
const ConsultationCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
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
                contributor_id: 1 // TODO: Get from auth context
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
        <Card>
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
        </Card>
    );
};

// ClientApprovalCard Component
const ClientApprovalCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
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
        <Card>
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
        </Card>
    );
};

// ActivityLogCard Component
const ActivityLogCard: React.FC<WorkflowCardProps> = ({ inquiry, onRefresh }) => {
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
            const response = await fetch('/activity-logs/note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inquiry_id: inquiry.id,
                    note: noteText,
                }),
            });

            if (response.ok) {
                setNoteText('');
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    return (
        <Card sx={{ height: 'fit-content', minHeight: '600px' }}>
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
        </Card>
    );
};

// Main InquiryDetailPage Component
export default function InquiryDetailPage() {
    const params = useParams();
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
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

    return (
        <Box sx={{ width: '100%', px: 3, py: 4 }}>
            {/* --- HEADER --- */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Inquiry - {inquiry.contact?.first_name} {inquiry.contact?.last_name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Manage the complete sales workflow from initial inquiry through to contract approval and project kickoff.
                </Typography>
            </Box>

            {/* --- WORKFLOW PROGRESS BAR --- */}
            <WorkflowProgressBar inquiry={inquiry} />

            {/* --- INTERACTIVE WORKFLOW STEPPER --- */}
            <WorkflowStepper inquiry={inquiry} onStepClick={scrollToSection} />

            {/* --- MAIN THREE-COLUMN WORKSPACE --- */}
            <Grid container spacing={3} sx={{ mt: 1 }}>

                {/* --- LEFT COLUMN (WIDER) --- */}
                <Grid item xs={12} md={5}>
                    <Stack spacing={3}>
                        <div id="needs-assessment-section">
                            <NeedsAssessmentCard inquiry={inquiry} />
                        </div>
                        <div id="estimates-section">
                            <EstimatesCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                        <div id="calls-section">
                            <CallsCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                    </Stack>
                </Grid>

                {/* --- MIDDLE COLUMN --- */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        <div id="proposals-section">
                            <ProposalsCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                        <div id="consultation-section">
                            <ConsultationCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                        <div id="quotes-section">
                            <QuotesCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                    </Stack>
                </Grid>

                {/* --- RIGHT COLUMN (THINNER) --- */}
                <Grid item xs={12} md={3}>
                    <Stack spacing={3}>
                        <div id="contracts-section">
                            <ContractsCard inquiry={inquiry} onRefresh={handleRefresh} />
                        </div>
                        <div id="approval-section">
                            <ClientApprovalCard inquiry={inquiry} onRefresh={handleRefresh} />
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
