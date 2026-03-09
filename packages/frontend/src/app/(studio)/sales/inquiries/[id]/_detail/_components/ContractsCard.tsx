import React, { useState, useEffect } from 'react';
import { Box, Typography, CardContent, Button, Chip, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Gavel, Add, Edit } from '@mui/icons-material';
import { contractsService } from '@/lib/api';
import type { WorkflowCardProps } from '../_lib';
import { WorkflowCard } from './WorkflowCard';

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

            try {
                const updatedContracts = await contractsService.getAllByInquiry(inquiry.id);
                setContracts(updatedContracts || []);
            } catch (error) {
                console.error('Error refreshing contracts:', error);
            }

            if (onRefresh) onRefresh();

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                            <Gavel sx={{ fontSize: 18, color: '#6366f1' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>Contracts</Typography>
                        {contracts.length > 0 && <Chip label={contracts.length} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }} />}
                    </Box>
                    <Button size="small" startIcon={<Add />} onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}>
                        New Contract
                    </Button>
                </Box>

                {contracts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
                            <Gavel sx={{ fontSize: 22, color: '#6366f1' }} />
                        </Box>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>No contracts yet</Typography>
                        <Typography sx={{ color: '#475569', fontSize: '0.72rem', mt: 0.5 }}>Draft a contract to seal the deal</Typography>
                    </Box>
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

export { ContractsCard };
