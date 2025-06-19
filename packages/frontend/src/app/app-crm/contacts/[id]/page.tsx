"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactsService } from "../../../../lib/api-services";
import { ContactData } from "../../../../lib/api-client";

// Material-UI Components
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip"; // Keep for future use with tags if added to ContactData
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from "@mui/material";

interface Activity {
  id: string;
  timestamp: string;
  note: string;
}

// Define EditContactFormData based on ContactData, excluding id and any activity-related fields if they were part of it.
// This ensures the form data aligns with what the backend expects for an update.
type EditContactFormData = Partial<Omit<ContactData, 'id'>>;

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contactId = params.id as string;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivityNote, setNewActivityNote] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<AlertColor>("success");

  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const { data: contact, isLoading, isError, error: queryError } = useQuery<ContactData, Error>(
    {
      queryKey: ["contact", contactId],
      queryFn: async () => {
        if (!contactId) throw new Error("No contact ID provided");
        const numericId = parseInt(contactId);
        if (isNaN(numericId)) throw new Error("Invalid contact ID format");
        return contactsService.getById(numericId); // Corrected: getById
      },
      enabled: !!contactId,
    }
  );

  // Effect for handling query errors with snackbar
  useEffect(() => {
    if (isError && queryError) {
      showSnackbar(queryError.message || "Error fetching contact details.", "error");
    }
  }, [isError, queryError]);

  // Edit Dialog State
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<EditContactFormData>({});
  const [editFormErrors, setEditFormErrors] = useState<{
    first_name?: string;
    last_name?: string; // Though optional, can still have validation messages
    email?: string;
  }>({});

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleClickOpenEditDialog = () => {
    if (contact) {
      setEditFormData({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        email: contact.email || "",
        phone_number: contact.phone_number || "",
        company_name: contact.company_name || "",
        type: contact.type || "Client",
      });
      setEditFormErrors({});
      setOpenEditDialog(true);
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleEditFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target;
    setEditFormData((prev: EditContactFormData) => ({ ...prev, [name]: value }));
    if (editFormErrors[name as keyof typeof editFormErrors]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: typeof editFormErrors = {};
    if (!editFormData.first_name?.trim()) errors.first_name = "First name is required";
    if (!editFormData.email?.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(editFormData.email))
      errors.email = "Invalid email format";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateContactMutation = useMutation<
    ContactData,
    Error,
    { id: number; data: EditContactFormData }
  >({
    mutationFn: ({ id, data }) => contactsService.update(id, data),
    onSuccess: (_updatedContactData: ContactData) => { // Prefixed unused variable
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showSnackbar("Contact updated successfully!", "success");
      handleCloseEditDialog();
    },
    onError: (err: Error) => {
      showSnackbar(err.message || "Error updating contact.", "error");
    },
  });

  const handleUpdateContactDetails = () => {
    if (!validateEditForm() || !contact) return;

    const numericId = parseInt(contactId);
    if (isNaN(numericId)) {
      showSnackbar("Invalid contact ID.", "error");
      return;
    }

    const dataToUpdate: EditContactFormData = {
      first_name: editFormData.first_name,
      last_name: editFormData.last_name,
      email: editFormData.email,
      phone_number: editFormData.phone_number || undefined,
      company_name: editFormData.company_name || undefined,
      type: editFormData.type,
    };

    updateContactMutation.mutate({ id: numericId, data: dataToUpdate });
  };

  const handleAddActivity = () => {
    if (!newActivityNote.trim() || !contact) return;
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: newActivityNote.trim(),
    };
    setActivities((prevActivities) => [...prevActivities, newActivity]);
    setNewActivityNote("");
    showSnackbar("Activity added (client-side)!", "info");
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading contact details...</Typography>
      </Box>
    );
  }

  if (isError || !contact) {
    // Snackbar for error is handled by useEffect, this is a fallback display
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5">
          {queryError?.message || "Contact Not Found"}
        </Typography>
        <Button
          component={Link}
          href="/app-crm/contacts"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Back to Contacts
        </Button>
      </Box>
    );
  }

  const displayName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
  const avatarLetters = `${contact.first_name?.[0] || ""}${contact.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton
          onClick={() => router.back()} // Corrected: Use router.back()
          aria-label="back to contacts"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {displayName}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleClickOpenEditDialog}
        >
          Edit Contact
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5} lg={4}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ width: 100, height: 100, mb: 2, fontSize: "2.5rem" }}>
              {avatarLetters}
            </Avatar>
            <Typography variant="h5" component="div" gutterBottom align="center">
              {displayName}
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {contact.company_name || "No company information"}
            </Typography>
            <Divider sx={{ my: 2, width: "100%" }} />
            <Box sx={{ width: "100%" }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Email:</strong> {contact.email}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Phone:</strong> {contact.phone_number || "N/A"}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Type:</strong> {contact.type || "N/A"}
              </Typography>
              {/* Address and Tags are not part of ContactData, so they are commented out */}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7} lg={8}>
          {/* Notes are not part of ContactData, so this section is commented out */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity History (Client-side)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                label="Add new activity note"
                value={newActivityNote}
                onChange={(e) => setNewActivityNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddActivity();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddActivity}
                disabled={!newActivityNote.trim() || updateContactMutation.isPending}
              >
                Add
              </Button>
            </Box>
            {!activities || activities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No activities recorded yet.
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                {activities
                  .slice() // Create a shallow copy before sorting to avoid mutating state directly if activities were from props
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((activity) => (
                    <ListItem
                      key={activity.id}
                      sx={{
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        alignItems: "flex-start",
                      }}
                    >
                      <ListItemText
                        primary={activity.note}
                        secondary={new Date(
                          activity.timestamp
                        ).toLocaleString()}
                        primaryTypographyProps={{
                          sx: { whiteSpace: "pre-line" },
                        }}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Contact Details</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="first_name"
            label="First Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.first_name || ""}
            onChange={handleEditFormChange}
            error={!!editFormErrors.first_name}
            helperText={editFormErrors.first_name}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="last_name"
            label="Last Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.last_name || ""}
            onChange={handleEditFormChange}
            error={!!editFormErrors.last_name}
            helperText={editFormErrors.last_name}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={editFormData.email || ""}
            onChange={handleEditFormChange}
            error={!!editFormErrors.email}
            helperText={editFormErrors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="phone_number"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={editFormData.phone_number || ""}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="company_name"
            label="Company"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.company_name || ""}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel id="edit-contact-type-label">Contact Type</InputLabel>
            <Select
              labelId="edit-contact-type-label"
              id="edit-contact-type-select"
              name="type"
              value={editFormData.type || "Client"}
              label="Contact Type"
              onChange={handleEditFormChange}
            >
              <MenuItem value="Client_Lead">Client Lead</MenuItem>
              <MenuItem value="Client">Client</MenuItem>
              <MenuItem value="Contributor">Contributor</MenuItem>
              <MenuItem value="Vendor">Vendor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: "16px 24px" }}>
          <Button onClick={handleCloseEditDialog} disabled={updateContactMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateContactDetails}
            variant="contained"
            disabled={updateContactMutation.isPending}
          >
            {updateContactMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>

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