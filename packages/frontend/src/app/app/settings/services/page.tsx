"use client";

import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Loading from "../../../components/Loading";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";

interface Service {
    name: string;
    rate: string;
    status: "active" | "inactive";
    category?: string; // Added category
}

export default function ServicesSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([
        {
            name: "Web Development",
            rate: "$150/hour",
            status: "active",
            category: "Development",
        },
        {
            name: "UI/UX Design",
            rate: "$120/hour",
            status: "active",
            category: "Design",
        },
        {
            name: "Consulting",
            rate: "$200/hour",
            status: "inactive",
            category: "Business",
        },
    ]);
    const [serviceCategories] = useState<string[]>([
        // Added predefined categories
        "Development",
        "Design",
        "Marketing",
        "Business",
        "Content Creation",
        "Other",
    ]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newServiceName, setNewServiceName] = useState("");
    const [newServiceRate, setNewServiceRate] = useState("");
    const [newServiceStatus, setNewServiceStatus] = useState<
        "active" | "inactive"
    >("active");
    const [newServiceCategory, setNewServiceCategory] = useState(""); // Added for category
    const [serviceNameError, setServiceNameError] = useState(false);
    const [serviceRateError, setServiceRateError] = useState(false);

    // State for Edit Dialog
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(
        null,
    );
    const [editServiceName, setEditServiceName] = useState("");
    const [editServiceRate, setEditServiceRate] = useState("");
    const [editServiceStatus, setEditServiceStatus] = useState<
        "active" | "inactive"
    >("active");
    const [editServiceCategory, setEditServiceCategory] = useState(""); // Added for category
    const [editServiceNameError, setEditServiceNameError] = useState(false);
    const [editServiceRateError, setEditServiceRateError] = useState(false);

    // State for Delete Confirmation Dialog
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [serviceToDeleteIndex, setServiceToDeleteIndex] = useState<
        number | null
    >(null);

    // State for Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] =
        useState<AlertColor>("success");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleClickOpenAddDialog = () => {
        setOpenAddDialog(true);
    };

    const handleCloseAddDialog = () => {
        setOpenAddDialog(false);
        setNewServiceName("");
        setNewServiceRate("");
        setNewServiceStatus("active");
        setNewServiceCategory(""); // Reset category
        setServiceNameError(false); // Reset error state
        setServiceRateError(false); // Reset error state
    };

    // Validation functions for Add/Edit Service
    const validateServiceName = (name: string): boolean => {
        if (!name.trim()) {
            setServiceNameError(true);
            return false;
        }
        setServiceNameError(false);
        return true;
    };

    const validateServiceRate = (rate: string): boolean => {
        if (!rate.trim()) {
            setServiceRateError(true);
            return false;
        }
        setServiceRateError(false);
        return true;
    };

    // Validation functions for Edit Service Dialog
    const validateEditServiceName = (name: string): boolean => {
        if (!name.trim()) {
            setEditServiceNameError(true);
            return false;
        }
        setEditServiceNameError(false);
        return true;
    };

    const validateEditServiceRate = (rate: string): boolean => {
        if (!rate.trim()) {
            setEditServiceRateError(true);
            return false;
        }
        setEditServiceRateError(false);
        return true;
    };

    const handleAddService = () => {
        // Trigger validation for all fields on submit, in case user didn't blur
        const isNameValid = validateServiceName(newServiceName);
        const isRateValid = validateServiceRate(newServiceRate);

        if (!isNameValid || !isRateValid) {
            return;
        }

        const newServiceToAdd: Service = {
            name: newServiceName,
            rate: newServiceRate,
            status: newServiceStatus,
            category: newServiceCategory.trim() || undefined, // Add category
        };
        setServices((prevServices) => [...prevServices, newServiceToAdd]);
        handleCloseAddDialog();
        showSnackbar("Service added successfully!", "success");
    };

    // Handlers for Edit Dialog
    const handleClickOpenEditDialog = (serviceToEdit: Service, index: number) => {
        setEditingService(serviceToEdit);
        setEditingServiceIndex(index);
        setEditServiceName(serviceToEdit.name);
        setEditServiceRate(serviceToEdit.rate);
        setEditServiceStatus(serviceToEdit.status);
        setEditServiceCategory(serviceToEdit.category || "");
        setEditServiceNameError(false); // Reset edit form errors
        setEditServiceRateError(false); // Reset edit form errors
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditingService(null);
        setEditingServiceIndex(null);
        setEditServiceName("");
        setEditServiceRate("");
        setEditServiceStatus("active"); // Corrected: Was using setNewServiceStatus indirectly or similar issue
        setEditServiceCategory("");
        setEditServiceNameError(false); // Corrected: Was using setServiceNameError
        setEditServiceRateError(false); // Corrected: Was using setServiceRateError
    };

    const handleUpdateService = () => {
        const isNameValid = validateEditServiceName(editServiceName);
        const isRateValid = validateEditServiceRate(editServiceRate);

        if (!isNameValid || !isRateValid || editingServiceIndex === null) {
            return;
        }

        const updatedService: Service = {
            name: editServiceName,
            rate: editServiceRate,
            status: editServiceStatus, // Corrected: Was using newServiceStatus or similar issue
            category: editServiceCategory.trim() || undefined,
        };

        setServices((prevServices) =>
            prevServices.map((service, index) =>
                index === editingServiceIndex ? updatedService : service,
            ),
        );
        handleCloseEditDialog();
        showSnackbar("Service updated successfully!", "success");
    };

    // Handlers for Delete Confirmation Dialog
    const handleClickOpenDeleteDialog = (service: Service, index: number) => {
        setServiceToDelete(service);
        setServiceToDeleteIndex(index);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setServiceToDelete(null);
        setServiceToDeleteIndex(null);
    };

    const handleConfirmDeleteService = () => {
        if (serviceToDeleteIndex !== null) {
            setServices((prevServices) =>
                prevServices.filter((_, index) => index !== serviceToDeleteIndex),
            );
            showSnackbar("Service deleted successfully!", "success");
        }
        handleCloseDeleteDialog();
    };

    // Snackbar handler
    const handleSnackbarClose = (
        event?: React.SyntheticEvent | Event,
        reason?: string,
    ) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackbarOpen(false);
    };

    const showSnackbar = (message: string, severity: AlertColor) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    if (isLoading) {
        return <Loading message="Loading services settings..." />;
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Services Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
                Manage your service offerings and pricing.
            </Typography>

            <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        mb: 3,
                        gap: { xs: 2, sm: 0 },
                    }}
                >
                    <Typography variant="h6">Your Services</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                        onClick={handleClickOpenAddDialog}
                    >
                        Add New Service
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    {services.map((service: Service, index: number) => (
                        <Grid item xs={12} md={6} lg={4} key={index}>
                            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 1,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{ fontSize: "1.1rem" }}
                                    >
                                        {service.name}
                                    </Typography>
                                    <Chip
                                        label={service.status}
                                        color={service.status === "active" ? "success" : "default"}
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Rate: {service.rate}
                                </Typography>
                                {service.category && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                        sx={{ mt: 0.5 }}
                                    >
                                        Category: {service.category}
                                    </Typography>
                                )}
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: "flex",
                                        flexDirection: { xs: "column", sm: "row" },
                                        gap: 1,
                                    }}
                                >
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ width: "100%" }}
                                        onClick={() => handleClickOpenEditDialog(service, index)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        sx={{ width: "100%" }}
                                        onClick={() => handleClickOpenDeleteDialog(service, index)}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Add Service Dialog */}
            <Dialog
                open={openAddDialog}
                onClose={handleCloseAddDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Add New Service</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Service Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newServiceName}
                        onChange={(e) => {
                            setNewServiceName(e.target.value);
                            if (serviceNameError && e.target.value.trim())
                                setServiceNameError(false);
                        }}
                        onBlur={() => validateServiceName(newServiceName)} // Added onBlur validation
                        sx={{ mb: 2, mt: 1 }}
                        error={serviceNameError}
                        helperText={serviceNameError ? "Service name is required" : ""}
                    />
                    <TextField
                        margin="dense"
                        id="rate"
                        label="Service Rate (e.g., $100/hour or $500)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newServiceRate}
                        onChange={(e) => {
                            setNewServiceRate(e.target.value);
                            if (serviceRateError && e.target.value.trim())
                                setServiceRateError(false);
                        }}
                        onBlur={() => validateServiceRate(newServiceRate)} // Added onBlur validation
                        sx={{ mb: 2 }}
                        error={serviceRateError}
                        helperText={serviceRateError ? "Service rate is required" : ""}
                    />
                    {/* Changed TextField to Select for Category in Add Dialog */}
                    <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                        <InputLabel id="add-category-select-label">
                            Category (Optional)
                        </InputLabel>
                        <Select
                            labelId="add-category-select-label"
                            id="category"
                            value={newServiceCategory}
                            label="Category (Optional)"
                            onChange={(e: SelectChangeEvent<string>) =>
                                setNewServiceCategory(e.target.value as string)
                            }
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {serviceCategories.map((cat) => (
                                <MenuItem key={cat} value={cat}>
                                    {cat}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="status-select-label">Status</InputLabel>
                        <Select
                            labelId="status-select-label"
                            id="status"
                            value={newServiceStatus}
                            label="Status"
                            onChange={(e: SelectChangeEvent<"active" | "inactive">) =>
                                setNewServiceStatus(e.target.value as "active" | "inactive")
                            }
                        >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: "16px 24px" }}>
                    <Button onClick={handleCloseAddDialog}>Cancel</Button>
                    <Button onClick={handleAddService} variant="contained">
                        Add Service
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Service Dialog */}
            {editingService && (
                <Dialog
                    open={openEditDialog}
                    onClose={handleCloseEditDialog}
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle>Edit Service</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="editName"
                            label="Service Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editServiceName}
                            onChange={(e) => {
                                setEditServiceName(e.target.value);
                                if (editServiceNameError && e.target.value.trim())
                                    setEditServiceNameError(false);
                            }}
                            onBlur={() => validateEditServiceName(editServiceName)} // Added onBlur validation
                            sx={{ mb: 2, mt: 1 }}
                            error={editServiceNameError}
                            helperText={
                                editServiceNameError ? "Service name is required" : ""
                            }
                        />
                        <TextField
                            margin="dense"
                            id="editRate"
                            label="Service Rate (e.g., $100/hour or $500)"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={editServiceRate}
                            onChange={(e) => {
                                setEditServiceRate(e.target.value);
                                if (editServiceRateError && e.target.value.trim())
                                    setEditServiceRateError(false);
                            }}
                            onBlur={() => validateEditServiceRate(editServiceRate)} // Added onBlur validation
                            sx={{ mb: 2 }}
                            error={editServiceRateError}
                            helperText={
                                editServiceRateError ? "Service rate is required" : ""
                            }
                        />
                        {/* Changed TextField to Select for Category in Edit Dialog */}
                        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                            <InputLabel id="edit-category-select-label">
                                Category (Optional)
                            </InputLabel>
                            <Select
                                labelId="edit-category-select-label"
                                id="editCategory"
                                value={editServiceCategory}
                                label="Category (Optional)"
                                onChange={(e: SelectChangeEvent<string>) =>
                                    setEditServiceCategory(e.target.value as string)
                                }
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {serviceCategories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="dense">
                            <InputLabel id="edit-status-select-label">Status</InputLabel>
                            <Select
                                labelId="edit-status-select-label"
                                id="editStatus"
                                value={editServiceStatus} // Corrected: Was using newServiceStatus or similar issue
                                label="Status"
                                onChange={(e: SelectChangeEvent<"active" | "inactive">) =>
                                    setEditServiceStatus(e.target.value as "active" | "inactive")
                                } // Corrected: Was using setNewServiceStatus
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ p: "16px 24px" }}>
                        <Button onClick={handleCloseEditDialog}>Cancel</Button>
                        <Button onClick={handleUpdateService} variant="contained">
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Delete Service Confirmation Dialog */}
            {serviceToDelete && (
                <Dialog
                    open={openDeleteDialog}
                    onClose={handleCloseDeleteDialog}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete the service &quot;
                            <strong>{serviceToDelete.name}</strong>&quot;? This action cannot
                            be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: "16px 24px" }}>
                        <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                        <Button
                            onClick={handleConfirmDeleteService}
                            variant="contained"
                            color="error"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
