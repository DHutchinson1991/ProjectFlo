"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Stack,
    Checkbox,
    ListItemText,
    Switch,
    FormControlLabel,
    Alert,
} from "@mui/material";
import { api } from "@/lib/api";
import { NeedsAssessmentTemplate } from "@/lib/types";

export default function NeedsAssessmentPage() {
    const [template, setTemplate] = useState<NeedsAssessmentTemplate | null>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [createInquiry, setCreateInquiry] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadTemplate = async () => {
            try {
                setLoading(true);
                const activeTemplate = await api.needsAssessmentTemplates.getActive();
                setTemplate(activeTemplate);
            } catch (err) {
                setError("Unable to load the needs assessment questionnaire.");
            } finally {
                setLoading(false);
            }
        };

        loadTemplate();
    }, []);

    const handleChange = (fieldKey: string, value: any) => {
        setResponses((prev) => ({ ...prev, [fieldKey]: value }));
    };

    const shouldShowQuestion = (condition: Record<string, any> | null) => {
        if (!condition?.field_key) return true;
        const currentValue = responses[condition.field_key];
        const expected = condition.value;
        switch (condition.operator) {
            case "not_equals":
                return currentValue !== expected;
            case "contains":
                return Array.isArray(currentValue)
                    ? currentValue.includes(expected)
                    : String(currentValue || "").includes(String(expected || ""));
            case "equals":
            default:
                return currentValue === expected;
        }
    };

    const validate = () => {
        if (!template) return false;
        const errors: Record<string, string> = {};
        template.questions
            .filter((question) => shouldShowQuestion(question.condition_json as Record<string, any>))
            .forEach((question) => {
                const key = question.field_key || `question_${question.id}`;
                const value = responses[key];
                if (question.required && (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
                    errors[key] = "Required";
                    return;
                }
                if (question.field_type === "email" && value) {
                    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
                    if (!emailValid) {
                        errors[key] = "Enter a valid email";
                    }
                }
            });
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!template) return;
        if (!validate()) return;
        try {
            setError(null);
            setSuccessMessage(null);
            const payload = {
                template_id: template.id,
                responses,
                create_inquiry: createInquiry,
            };
            await api.needsAssessmentSubmissions.create(payload);
            setSuccessMessage("Needs assessment submitted successfully.");
            setResponses({});
        } catch (err) {
            setError("Failed to submit the needs assessment.");
        }
    };

    if (loading) {
        return (
            <Box>
                <Typography variant="h5">Loading questionnaire...</Typography>
            </Box>
        );
    }

    if (!template) {
        return (
            <Box>
                <Typography variant="h5">No active questionnaire available.</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {template.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {template.description}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        {template.questions
                            .filter((question) => shouldShowQuestion(question.condition_json as Record<string, any>))
                            .map((question) => {
                            const key = question.field_key || `question_${question.id}`;
                            const value = responses[key] ?? "";
                            const errorMessage = fieldErrors[key];

                            if (question.field_type === "textarea") {
                                return (
                                    <TextField
                                        key={key}
                                        label={question.prompt}
                                        value={value}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        multiline
                                        rows={3}
                                        required={Boolean(question.required)}
                                        error={Boolean(errorMessage)}
                                        helperText={errorMessage}
                                        fullWidth
                                    />
                                );
                            }

                            if (question.field_type === "select" || question.field_type === "multiselect") {
                                const options = (question.options as any)?.values || [];
                                return (
                                    <FormControl key={key} fullWidth>
                                        <InputLabel>{question.prompt}</InputLabel>
                                        <Select
                                            label={question.prompt}
                                            multiple={question.field_type === "multiselect"}
                                            value={value || (question.field_type === "multiselect" ? [] : "")}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            renderValue={(selected: any) =>
                                                Array.isArray(selected) ? selected.join(", ") : selected
                                            }
                                            error={Boolean(errorMessage)}
                                        >
                                            {options.map((option: string) => (
                                                <MenuItem key={option} value={option}>
                                                    {question.field_type === "multiselect" && (
                                                        <Checkbox checked={Array.isArray(value) && value.includes(option)} />
                                                    )}
                                                    <ListItemText primary={option} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            }

                            return (
                                <TextField
                                    key={key}
                                    label={question.prompt}
                                    value={value}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    type={question.field_type === "date" ? "date" : "text"}
                                    required={Boolean(question.required)}
                                        error={Boolean(errorMessage)}
                                        helperText={errorMessage}
                                    fullWidth
                                    InputLabelProps={question.field_type === "date" ? { shrink: true } : undefined}
                                />
                            );
                            })}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={createInquiry}
                                    onChange={(e) => setCreateInquiry(e.target.checked)}
                                />
                            }
                            label="Create inquiry after submission"
                        />

                        <Button variant="contained" onClick={handleSubmit}>
                            Submit Needs Assessment
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
