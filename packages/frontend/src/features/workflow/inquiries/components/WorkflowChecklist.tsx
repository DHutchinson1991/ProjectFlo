'use client';

import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    Chip,
    Button,
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Info as InfoIcon,
    PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { Inquiry, InquiryStatus } from '@/features/workflow/inquiries/types';

interface WorkflowStep {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    optional?: boolean;
    action?: () => void;
    actionLabel?: string;
}

interface WorkflowChecklistProps {
    inquiry: Inquiry;
    onCreateProposal: () => void;
    onCreateEstimate: () => void;
    onCreateContract: () => void;
    onCreateInvoice: () => void;
    onSendDocument: (type: 'proposal' | 'estimate' | 'contract', id: number) => void;
}

export default function WorkflowChecklist({
    inquiry,
    onCreateProposal,
    onCreateEstimate,
    onCreateContract,
    onCreateInvoice,
    onSendDocument,
}: WorkflowChecklistProps) {
    // Calculate workflow steps based on inquiry data
    const getWorkflowSteps = (): WorkflowStep[] => {
        const hasProposals = !!(inquiry.proposals && inquiry.proposals.length > 0);
        const hasSentProposal = !!(inquiry.proposals?.some(p => p.status === 'Sent' || p.status === 'Accepted'));
        const hasAcceptedProposal = !!(inquiry.proposals?.some(p => p.status === 'Accepted'));

        const hasEstimates = !!(inquiry.estimates && inquiry.estimates.length > 0);
        const hasSentEstimate = !!(inquiry.estimates?.some(e => e.status === 'Sent' || e.status === 'Accepted'));
        const hasAcceptedEstimate = !!(inquiry.estimates?.some(e => e.status === 'Accepted'));

        const hasContracts = !!(inquiry.contracts && inquiry.contracts.length > 0);
        const hasSignedContract = !!(inquiry.contracts?.some(c => c.status === 'Signed'));

        const hasInvoices = !!(inquiry.invoices && inquiry.invoices.length > 0);
        const hasPaidInvoice = !!(inquiry.invoices?.some(i => i.status === 'Paid'));

        return [
            {
                id: 'initial_contact',
                label: 'Initial Contact',
                description: 'Inquiry received and contact information captured',
                completed: true, // Always true if we have an inquiry
            },
            {
                id: 'needs_assessment',
                label: 'Needs Assessment',
                description: 'Event details and requirements gathered',
                completed: !!(inquiry.event_date && inquiry.venue_details),
            },
            {
                id: 'estimate_or_proposal',
                label: 'Estimate or Proposal',
                description: 'Create initial estimate or detailed proposal',
                completed: hasEstimates || hasProposals,
                action: (() => {
                    if (!hasEstimates && !hasProposals) {
                        return onCreateEstimate; // Default to estimate
                    }
                    return undefined;
                })(),
                actionLabel: (() => {
                    if (!hasEstimates && !hasProposals) {
                        return 'Create Estimate';
                    }
                    return undefined;
                })(),
            },
            {
                id: 'send_estimate_proposal',
                label: 'Send Estimate/Proposal',
                description: 'Share pricing and scope with client',
                completed: hasSentEstimate || hasSentProposal,
                action: (() => {
                    if (inquiry.estimates?.some(e => e.status === 'Draft')) {
                        const draftEstimate = inquiry.estimates.find(e => e.status === 'Draft');
                        return draftEstimate ? () => onSendDocument('estimate', draftEstimate.id) : undefined;
                    }
                    if (inquiry.proposals?.some(p => p.status === 'Draft')) {
                        const draftProposal = inquiry.proposals.find(p => p.status === 'Draft');
                        return draftProposal ? () => onSendDocument('proposal', draftProposal.id) : undefined;
                    }
                    return undefined;
                })(),
                actionLabel: (() => {
                    if (inquiry.estimates?.some(e => e.status === 'Draft')) return 'Send Estimate';
                    if (inquiry.proposals?.some(p => p.status === 'Draft')) return 'Send Proposal';
                    return undefined;
                })(),
            },
            {
                id: 'client_approval',
                label: 'Client Approval',
                description: 'Client accepts estimate or proposal',
                completed: hasAcceptedEstimate || hasAcceptedProposal,
            },
            {
                id: 'contract_creation',
                label: 'Contract Creation',
                description: 'Formal contract prepared and signed',
                completed: hasSignedContract,
                action: !hasContracts ? onCreateContract : undefined,
                actionLabel: !hasContracts ? 'Create Contract' : undefined,
            },
            {
                id: 'project_execution',
                label: 'Project Execution',
                description: 'Work delivered according to agreement',
                completed: inquiry.status === InquiryStatus.WON,
                optional: true,
            },
            {
                id: 'invoicing',
                label: 'Invoicing & Payment',
                description: 'Invoice sent and payment received',
                completed: hasPaidInvoice,
                action: !hasInvoices ? onCreateInvoice : undefined,
                actionLabel: !hasInvoices ? 'Create Invoice' : undefined,
            },
        ];
    };

    const steps = getWorkflowSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    // Get next recommended action
    const getNextAction = () => {
        const incompleteStep = steps.find(step => !step.completed && !step.optional);
        return incompleteStep;
    };

    const nextAction = getNextAction();

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Workflow Progress
                    </Typography>
                    <Chip
                        label={`${completedSteps}/${totalSteps}`}
                        color={progressPercentage === 100 ? 'success' : 'primary'}
                        size="small"
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                            }
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {Math.round(progressPercentage)}% Complete
                    </Typography>
                </Box>

                {/* Next Action Callout */}
                {nextAction && (
                    <Box sx={{
                        mb: 3,
                        p: 2,
                        backgroundColor: 'primary.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'primary.200'
                    }}>
                        <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>
                            Next Step
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {nextAction.label}
                        </Typography>
                        {nextAction.action && nextAction.actionLabel && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={nextAction.action}
                                sx={{ mt: 1 }}
                            >
                                {nextAction.actionLabel}
                            </Button>
                        )}
                    </Box>
                )}

                {/* Workflow Steps */}
                <List dense>
                    {steps.map((step) => (
                        <ListItem
                            key={step.id}
                            sx={{
                                px: 0,
                                opacity: step.optional && !step.completed ? 0.6 : 1,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {step.completed ? (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                    <RadioButtonUncheckedIcon color="action" fontSize="small" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                textDecoration: step.completed ? 'line-through' : 'none',
                                                color: step.completed ? 'text.secondary' : 'text.primary'
                                            }}
                                        >
                                            {step.label}
                                        </Typography>
                                        {step.optional && (
                                            <Chip label="Optional" size="small" variant="outlined" />
                                        )}
                                        <Tooltip title={step.description}>
                                            <IconButton size="small">
                                                <InfoIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            />
                            {step.action && step.actionLabel && !step.completed && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={step.action}
                                    >
                                        {step.actionLabel}
                                    </Button>
                                    {/* Show alternative action for estimate/proposal step */}
                                    {step.id === 'estimate_or_proposal' &&
                                        !(inquiry.estimates && inquiry.estimates.length > 0) &&
                                        !(inquiry.proposals && inquiry.proposals.length > 0) && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={onCreateProposal}
                                            >
                                                Create Proposal
                                            </Button>
                                        )}
                                </Box>
                            )}
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}
