"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert
} from '@mui/material';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';

// 1. IMPORT THE REAL API SERVICE
import { proposalsService } from '@/lib/api';
import { Proposal } from '@/lib/types'; // Make sure this type is defined and includes `content: OutputData`

const EDITOR_HOLDER_ID = 'editorjs-holder';

export default function ProposalBuilderPage() {
    const params = useParams();
    const inquiryId = parseInt(params.inquiryId as string);
    const proposalId = parseInt(params.proposalId as string);
    const editorInstance = useRef<EditorJS | null>(null);

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

    // Initialize Editor.js
    const initEditor = (initialContent: OutputData) => {
        if (editorInstance.current) {
            return;
        }

        // Check if the DOM element exists before initializing
        const holder = document.getElementById(EDITOR_HOLDER_ID);
        if (!holder) {
            console.warn('Editor holder element not found, retrying...');
            setTimeout(() => initEditor(initialContent), 100);
            return;
        }

        const editor = new EditorJS({
            holder: EDITOR_HOLDER_ID,
            data: initialContent,
            onReady: () => {
                console.log('Editor.js is ready to work!');
            },
            tools: {
                header: Header,
                list: List,
                paragraph: Paragraph,
            },
        });
        editorInstance.current = editor;
    };

    // Fetch proposal data
    useEffect(() => {
        if (!proposalId || !inquiryId) return;

        const fetchProposal = async () => {
            setIsLoading(true);
            try {
                // 2. UPDATE DATA LOADING WITH REAL API CALL
                const data = await proposalsService.getById(inquiryId, proposalId); // REAL CALL
                setProposal(data);
            } catch (error) {
                console.error("Failed to load proposal", error);
                setNotification({ message: 'Failed to load proposal.', severity: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProposal();
    }, [proposalId, inquiryId]);

    // Initialize editor after component is rendered and data is loaded
    useEffect(() => {
        if (!proposal || isLoading) return;

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            initEditor(proposal.content || { blocks: [], version: "2.30.8", time: Date.now() });
        }, 100);

        return () => {
            clearTimeout(timer);
            if (editorInstance.current?.destroy) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [proposal, isLoading]);

    // 3. UPDATE DATA SAVING WITH REAL API CALL
    const handleSaveProposal = async () => {
        if (!editorInstance.current || !proposal || !inquiryId) return;

        try {
            const content = await editorInstance.current.save();
            const updatedData = {
                title: proposal.title,
                status: proposal.status,
                content: content,
            };
            await proposalsService.update(inquiryId, proposal.id, updatedData); // REAL CALL
            setNotification({ message: 'Proposal Saved!', severity: 'success' });
        } catch (error) {
            console.error('Failed to save proposal:', error);
            setNotification({ message: 'Error saving proposal.', severity: 'error' });
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        if (!proposal) return;
        setProposal(prev => ({ ...prev!, [field]: value }));
    }

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3, display: 'flex', gap: 3, height: 'calc(100vh - 88px)' }}>
            {/* Main Editor Content */}
            <Paper sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                <Typography variant="h4" sx={{ mb: 2 }}>Proposal Builder</Typography>
                <Box id={EDITOR_HOLDER_ID} sx={{ '& .codex-editor__redactor': { pb: '100px !important' } }} />
            </Paper>

            {/* Settings Sidebar */}
            <Box sx={{ width: '320px', flexShrink: 0 }}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Settings</Typography>
                    <TextField
                        label="Proposal Title"
                        fullWidth
                        variant="outlined"
                        value={proposal?.title || ''}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={proposal?.status || 'Draft'}
                            label="Status"
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                        >
                            <MenuItem value="Draft">Draft</MenuItem>
                            <MenuItem value="Sent">Sent</MenuItem>
                            <MenuItem value="Accepted">Accepted</MenuItem>
                            <MenuItem value="Declined">Declined</MenuItem>
                        </Select>
                    </FormControl>
                    <Button fullWidth variant="contained" onClick={handleSaveProposal}>
                        Save Proposal
                    </Button>
                </Paper>
            </Box>

            {/* --- JSX INCLUDES Snackbar for notifications --- */}
            <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)}>
                <Alert onClose={() => setNotification(null)} severity={notification?.severity || 'info'} sx={{ width: '100%' }}>
                    {notification?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
