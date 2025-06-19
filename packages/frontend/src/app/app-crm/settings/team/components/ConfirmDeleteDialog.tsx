"use client";

import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    memberName: string | null;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({ open, onClose, onConfirm, memberName }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
            onClose(); // Close on success
        } catch (error) {
            // Error handling can be added here if needed, or rely on page-level error display
            console.error("Deletion failed", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete {memberName || "this member"}? This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isDeleting}>Cancel</Button>
                <Button onClick={handleConfirm} color="error" variant="contained" disabled={isDeleting}>
                    {isDeleting ? <CircularProgress size={24} /> : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
