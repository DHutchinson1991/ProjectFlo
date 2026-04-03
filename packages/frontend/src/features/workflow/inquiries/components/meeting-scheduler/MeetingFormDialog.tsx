import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Button,
} from '@mui/material';
import { MeetingType } from '@/features/workflow/calendar/types';
import type { MeetingFormData } from './types';
import { calculateEndTime } from '@/shared/utils/dateTime';

interface MeetingFormDialogProps {
    open: boolean;
    onClose: () => void;
    formData: MeetingFormData;
    setFormData: React.Dispatch<React.SetStateAction<MeetingFormData>>;
    errors: Record<string, string>;
    isEditing: boolean;
    isLoading: boolean;
    onSubmit: () => void;
    defaultDurationMinutes: number;
}

const MeetingFormDialog: React.FC<MeetingFormDialogProps> = ({
    open,
    onClose,
    formData,
    setFormData,
    errors,
    isEditing,
    isLoading,
    onSubmit,
    defaultDurationMinutes,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
            {isEditing ? 'Edit Meeting' : 'Schedule New Meeting'}
        </DialogTitle>
        <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Title */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Meeting Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        error={!!errors.title}
                        helperText={errors.title}
                        required
                    />
                </Grid>

                <input type="hidden" value={formData.event_type} />

                {/* Meeting Method */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.meeting_type}>
                        <InputLabel>Meeting Method</InputLabel>
                        <Select
                            value={formData.meeting_type || ''}
                            label="Meeting Method"
                            onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value as MeetingType })}
                        >
                            <MenuItem value="ONLINE">Online</MenuItem>
                            <MenuItem value="VIDEO_CALL">Video Call</MenuItem>
                            <MenuItem value="PHONE_CALL">Phone Call</MenuItem>
                            <MenuItem value="IN_PERSON">In Person</MenuItem>
                        </Select>
                        {errors.meeting_type && (
                            <Typography variant="caption" color="error">
                                {errors.meeting_type}
                            </Typography>
                        )}
                    </FormControl>
                </Grid>

                {/* Start Time */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="Start Time"
                        value={formData.start_time}
                        onChange={(e) => {
                            const newStartTime = e.target.value;
                            const newEndTime = calculateEndTime(newStartTime, defaultDurationMinutes);
                            setFormData({
                                ...formData,
                                start_time: newStartTime,
                                end_time: newEndTime
                            });
                        }}
                        error={!!errors.start_time}
                        helperText={errors.start_time}
                        InputLabelProps={{ shrink: true }}
                        required
                    />
                </Grid>

                {/* End Time */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="End Time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        error={!!errors.end_time}
                        helperText={errors.end_time}
                        InputLabelProps={{ shrink: true }}
                        required
                    />
                </Grid>

                {/* Meeting URL (for online meetings) */}
                {(formData.meeting_type === 'ONLINE' || formData.meeting_type === 'VIDEO_CALL') && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Meeting URL"
                            value={formData.meeting_url}
                            onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                            error={!!errors.meeting_url}
                            helperText={errors.meeting_url}
                            placeholder="https://zoom.us/j/..."
                            required
                        />
                    </Grid>
                )}

                {/* Location (for in-person meetings) */}
                {formData.meeting_type === 'IN_PERSON' && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            error={!!errors.location}
                            helperText={errors.location}
                            placeholder="Meeting address or location"
                            required
                        />
                    </Grid>
                )}

                {/* Description */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description (Optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Meeting agenda, topics to discuss, etc."
                    />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} disabled={isLoading}>
                Cancel
            </Button>
            <Button
                variant="contained"
                onClick={onSubmit}
                disabled={isLoading}
            >
                {isEditing ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
        </DialogActions>
    </Dialog>
);

export default MeetingFormDialog;
