import React from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface DeliverableDangerZoneProps {
    onDelete: () => void;
    deleting: boolean;
}

export default function DeliverableDangerZone({ onDelete, deleting }: DeliverableDangerZoneProps) {
    return (
        <Card sx={{ mt: 3 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                    Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Deleting this template is permanent and cannot be undone.
                </Typography>
                <Button
                    onClick={onDelete}
                    disabled={deleting}
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                >
                    {deleting ? 'Deleting...' : 'Delete Template'}
                </Button>
            </CardContent>
        </Card>
    );
}
