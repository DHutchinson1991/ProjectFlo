"use client";

import React, { useState, useEffect } from "react";
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
import { Contributor, Role, UpdateContributorDto } from "../../../../../lib/api-client";

interface EditMemberModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: UpdateContributorDto) => Promise<void>;
    member: Contributor | null;
    roles: Role[];
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ open, onClose, onSubmit, member, roles }) => {
    const [formData, setFormData] = useState<Partial<UpdateContributorDto>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (member && member.contact) { // Check for member.contact
            setFormData({
                email: member.contact.email,
                first_name: member.contact.first_name,
                last_name: member.contact.last_name,
                role_id: member.role?.id
            });
        } else {
            setFormData({});
        }
    }, [member, open]); // Reset form when member changes or modal opens

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (event: any) => {
        setFormData(prev => ({ ...prev, role_id: event.target.value as number }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member) return;
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            // Filter out empty password string if not changed
            const dataToSubmit = { ...formData };
            if (dataToSubmit.password === "") {
                delete dataToSubmit.password;
            }
            await onSubmit(member.id, dataToSubmit);
            onClose();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to update member.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open || !member || !member.contact) return null; // Check for member.contact

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Edit Member: {member.contact.first_name || member.contact.email}</DialogTitle>
            <DialogContent>
                {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
                <TextField autoFocus margin="dense" name="email" label="Email Address" type="email" fullWidth variant="outlined" value={formData.email || ""} onChange={handleChange} disabled={isSubmitting} />
                <TextField margin="dense" name="first_name" label="First Name" type="text" fullWidth variant="outlined" value={formData.first_name || ""} onChange={handleChange} disabled={isSubmitting} />
                <TextField margin="dense" name="last_name" label="Last Name" type="text" fullWidth variant="outlined" value={formData.last_name || ""} onChange={handleChange} disabled={isSubmitting} />
                <TextField margin="dense" name="password" label="New Password (optional)" type="password" fullWidth variant="outlined" value={formData.password || ""} onChange={handleChange} helperText="Leave blank to keep current password" disabled={isSubmitting} />
                <FormControl fullWidth margin="dense" disabled={isSubmitting}>
                    <InputLabel id="edit-role-select-label">Role</InputLabel>
                    <Select labelId="edit-role-select-label" name="role_id" value={formData.role_id || ""} onChange={handleRoleChange} label="Role">
                        {roles.map(role => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditMemberModal;
