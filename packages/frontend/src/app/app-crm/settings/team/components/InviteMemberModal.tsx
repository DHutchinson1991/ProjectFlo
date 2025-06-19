"use client";

import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { NewContributorData, Role } from "../../../../../lib/api-client";

interface InviteMemberModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: NewContributorData) => Promise<void>;
    roles: Role[];
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ open, onClose, onSubmit, roles }) => {
    const [formData, setFormData] = useState<Partial<NewContributorData>>({ email: "", first_name: "", last_name: "", password: "", role_id: undefined });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => { // any for Select
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (event: any) => { // Using SelectChangeEvent<number> from @mui/material/Select might be better
        setFormData(prev => ({ ...prev, role_id: event.target.value as number }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password || formData.role_id === undefined) {
            setSubmitError("Email, password, and role are required.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await onSubmit(formData as NewContributorData);
            onClose(); // Close on success
            setFormData({ email: "", first_name: "", last_name: "", password: "", role_id: undefined }); // Reset form
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to invite member.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogContent>
                {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
                <TextField autoFocus margin="dense" name="email" label="Email Address" type="email" fullWidth variant="outlined" value={formData.email || ""} onChange={handleChange} required disabled={isSubmitting} />
                <TextField margin="dense" name="first_name" label="First Name" type="text" fullWidth variant="outlined" value={formData.first_name || ""} onChange={handleChange} disabled={isSubmitting} />
                <TextField margin="dense" name="last_name" label="Last Name" type="text" fullWidth variant="outlined" value={formData.last_name || ""} onChange={handleChange} disabled={isSubmitting} />
                <TextField margin="dense" name="password" label="Password" type="password" fullWidth variant="outlined" value={formData.password || ""} onChange={handleChange} required disabled={isSubmitting} />
                <FormControl fullWidth margin="dense" required disabled={isSubmitting}>
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select labelId="role-select-label" name="role_id" value={formData.role_id || ""} onChange={handleRoleChange} label="Role">
                        {roles.map(role => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Invite"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InviteMemberModal;
