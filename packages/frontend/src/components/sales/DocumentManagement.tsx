'use client';

import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import { Inquiry } from '@/lib/types';

interface DocumentManagementProps {
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

export default function DocumentManagement({
    inquiry,
    onCreateProposal,
    onCreateEstimate,
    onCreateContract,
    onCreateInvoice,
    onEditDocument,
    onSendDocument,
    onDeleteDocument,
    onDownloadDocument,
}: DocumentManagementProps) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedDocument, setSelectedDocument] = useState<{
        type: 'proposal' | 'estimate' | 'contract' | 'invoice';
        id: number;
    } | null>(null);

    const handleMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        type: 'proposal' | 'estimate' | 'contract' | 'invoice',
        id: number
    ) => {
        setMenuAnchor(event.currentTarget);
        setSelectedDocument({ type, id });
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedDocument(null);
    };

    const handleMenuAction = (action: 'edit' | 'send' | 'delete' | 'download') => {
        if (!selectedDocument) return;

        switch (action) {
            case 'edit':
                onEditDocument(selectedDocument.type, selectedDocument.id);
                break;
            case 'send':
                onSendDocument(selectedDocument.type, selectedDocument.id);
                break;
            case 'delete':
                onDeleteDocument(selectedDocument.type, selectedDocument.id);
                break;
            case 'download':
                onDownloadDocument(selectedDocument.type, selectedDocument.id);
                break;
        }
        handleMenuClose();
    };

    const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
        switch (status.toLowerCase()) {
            case 'draft':
                return 'default';
            case 'sent':
                return 'info';
            case 'accepted':
            case 'signed':
            case 'paid':
                return 'success';
            case 'declined':
            case 'cancelled':
            case 'overdue':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Proposals and Estimates Card */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Proposals & Estimates
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={onCreateEstimate}
                            >
                                Estimate
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={onCreateProposal}
                            >
                                Proposal
                            </Button>
                        </Box>
                    </Box>

                    {/* Estimates Table */}
                    {inquiry.estimates && inquiry.estimates.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                Estimates ({inquiry.estimates.length})
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Number</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {inquiry.estimates.map((estimate) => (
                                            <TableRow key={estimate.id}>
                                                <TableCell>{estimate.estimate_number}</TableCell>
                                                <TableCell>${estimate.total_amount.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={estimate.status}
                                                        size="small"
                                                        color={getStatusColor(estimate.status)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {estimate.issue_date.toLocaleDateString()}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, 'estimate', estimate.id)}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* Proposals Table */}
                    {inquiry.proposals && inquiry.proposals.length > 0 ? (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                                Proposals ({inquiry.proposals.length})
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Title</TableCell>
                                            <TableCell>Version</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {inquiry.proposals.map((proposal) => (
                                            <TableRow key={proposal.id}>
                                                <TableCell>{proposal.title}</TableCell>
                                                <TableCell>v{proposal.version}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={proposal.status}
                                                        size="small"
                                                        color={getStatusColor(proposal.status)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {proposal.created_at.toLocaleDateString()}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, 'proposal', proposal.id)}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        inquiry.estimates && inquiry.estimates.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No proposals or estimates created yet.
                            </Typography>
                        )
                    )}

                    {!inquiry.estimates?.length && !inquiry.proposals?.length && (
                        <Typography variant="body2" color="text.secondary">
                            No proposals or estimates created yet.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Contracts Card */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Contracts ({inquiry.contracts?.length || 0})
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={onCreateContract}
                        >
                            Create Contract
                        </Button>
                    </Box>

                    {inquiry.contracts && inquiry.contracts.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Created</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inquiry.contracts.map((contract) => (
                                        <TableRow key={contract.id}>
                                            <TableCell>{contract.title}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={contract.status}
                                                    size="small"
                                                    color={getStatusColor(contract.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {contract.created_at.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, 'contract', contract.id)}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No contracts created yet.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Invoices Card */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Invoices ({inquiry.invoices?.length || 0})
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={onCreateInvoice}
                        >
                            Create Invoice
                        </Button>
                    </Box>

                    {inquiry.invoices && inquiry.invoices.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Number</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inquiry.invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell>{invoice.invoice_number}</TableCell>
                                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={invoice.status}
                                                    size="small"
                                                    color={getStatusColor(invoice.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {invoice.due_date.toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, 'invoice', invoice.id)}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No invoices created yet.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleMenuAction('edit')}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('send')}>
                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                    Send
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('download')}>
                    <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                    Download
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>
        </Box>
    );
}
