'use client';

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Inquiry } from '@/features/workflow/inquiries/types';
import WorkflowChecklist from './WorkflowChecklist';
import DocumentManagement from './DocumentManagement';

interface InquiryCommandCenterProps {
    inquiry: Inquiry;
    onCreateProposal: () => void;
    onCreateEstimate: () => void;
    onCreateContract: () => void;
    onCreateInvoice: () => void;
    onEditDocument: (type: 'proposal' | 'estimate' | 'contract' | 'invoice', id: number) => void;
    onSendDocument: (type: 'proposal' | 'estimate' | 'contract' | 'invoice', id: number) => void;
    onDeleteDocument: (type: 'proposal' | 'estimate' | 'contract' | 'invoice', id: number) => void;
    onDownloadDocument: (type: 'proposal' | 'estimate' | 'contract' | 'invoice', id: number) => void;
}

export default function InquiryCommandCenter({
    inquiry,
    onCreateProposal,
    onCreateEstimate,
    onCreateContract,
    onCreateInvoice,
    onEditDocument,
    onSendDocument,
    onDeleteDocument,
    onDownloadDocument,
}: InquiryCommandCenterProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header */}
            <Card>
                <CardContent>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Inquiry Command Center
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your inquiry workflow, track progress, and handle all documents from one place.
                    </Typography>
                </CardContent>
            </Card>

            {/* Workflow Progress */}
            <WorkflowChecklist
                inquiry={inquiry}
                onCreateProposal={onCreateProposal}
                onCreateEstimate={onCreateEstimate}
                onCreateContract={onCreateContract}
                onCreateInvoice={onCreateInvoice}
                onSendDocument={onSendDocument}
            />

            {/* Document Management */}
            <DocumentManagement
                inquiry={inquiry}
                onCreateProposal={onCreateProposal}
                onCreateEstimate={onCreateEstimate}
                onCreateContract={onCreateContract}
                onCreateInvoice={onCreateInvoice}
                onEditDocument={onEditDocument}
                onSendDocument={onSendDocument}
                onDeleteDocument={onDeleteDocument}
                onDownloadDocument={onDownloadDocument}
            />
        </Box>
    );
}
