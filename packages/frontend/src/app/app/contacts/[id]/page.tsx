"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import Loading from "../../../components/Loading"; // Adjusted path
import Link from "next/link";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField"; // Added
import Dialog from "@mui/material/Dialog"; // Added
import DialogActions from "@mui/material/DialogActions"; // Added
import DialogContent from "@mui/material/DialogContent"; // Added
import DialogTitle from "@mui/material/DialogTitle"; // Added
import Snackbar from "@mui/material/Snackbar"; // Added
import Alert, { AlertColor } from "@mui/material/Alert"; // Added
import List from "@mui/material/List"; // Added
import ListItem from "@mui/material/ListItem"; // Added
import ListItemText from "@mui/material/ListItemText"; // Added

interface Activity {
  id: string;
  timestamp: string;
  note: string;
}

// Dummy data - in a real app, this would come from a context, API, or prop
const initialContacts: Contact[] = [
  {
    id: "1",
    name: "Alice Wonderland",
    email: "alice@example.com",
    phone: "555-0101",
    company: "Mad Hatter Inc.",
    notes: "Loves tea parties. Potential for a large project.",
    address: "123 Rabbit Hole Lane, Wonderland",
    tags: ["VIP", "Design"],
    activities: [
      {
        id: "act1",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Initial consultation call.",
      },
      {
        id: "act2",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Sent proposal for Project TeaParty.",
      },
    ],
  },
  {
    id: "2",
    name: "Bob The Builder",
    email: "bob@example.com",
    phone: "555-0102",
    company: "BuildIt LLC",
    notes: "Always busy. Needs quick turnarounds.",
    address: "456 Construction Ave, Buildsville",
    tags: ["Construction", "Urgent"],
    activities: [
      {
        id: "act3",
        timestamp: new Date().toISOString(),
        note: "Followed up on the skyscraper blueprint.",
      },
    ],
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "555-0103",
    company: "Peanuts Corp.",
    notes: "Good grief! A bit indecisive.",
    address: "789 Kite Street, Toontown",
    tags: ["Animation"],
    activities: [],
  },
];

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  address?: string;
  tags?: string[];
  activities?: Activity[]; // Added activities
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const [contact, setContact] = useState<Contact | null | undefined>(undefined);

  // Edit Dialog State
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Contact>>({});
  const [editFormErrors, setEditFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  // Snackbar State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<AlertColor>("success");

  // Activity State
  const [newActivityNote, setNewActivityNote] = useState("");

  useEffect(() => {
    if (contactId) {
      // Simulate fetching contact details
      const foundContact = initialContacts.find((c) => c.id === contactId);
      const timer = setTimeout(() => {
        setContact(foundContact || null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [contactId]);

  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // --- Edit Contact Logic ---
  const handleClickOpenEditDialog = () => {
    if (contact) {
      setEditFormData({
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        company: contact.company || "",
        notes: contact.notes || "",
        address: contact.address || "",
        // Tags might need a more complex input, handling as string for now if needed or omitting
      });
      setEditFormErrors({});
      setOpenEditDialog(true);
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleEditFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editFormErrors[name as keyof typeof editFormErrors]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: { name?: string; email?: string } = {};
    if (!editFormData.name?.trim()) errors.name = "Name is required";
    if (!editFormData.email?.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(editFormData.email))
      errors.email = "Invalid email format";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateContactDetails = () => {
    if (!validateEditForm() || !contact) return;

    const updatedContactFields = { ...editFormData };
    // Ensure all fields from Contact interface are present, even if empty
    const fullUpdatedContact: Contact = {
      id: contact.id,
      name: updatedContactFields.name || contact.name,
      email: updatedContactFields.email || contact.email,
      phone: updatedContactFields.phone || undefined,
      company: updatedContactFields.company || undefined,
      notes: updatedContactFields.notes || undefined,
      address: updatedContactFields.address || undefined,
      tags: contact.tags, // Assuming tags are not edited in this simple form
      activities: contact.activities, // Preserve activities
    };

    setContact(fullUpdatedContact);

    // Simulate updating the master list (initialContacts)
    const contactIndex = initialContacts.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      initialContacts[contactIndex] = {
        ...initialContacts[contactIndex],
        ...fullUpdatedContact,
      };
    }

    showSnackbar("Contact updated successfully!", "success");
    handleCloseEditDialog();
  };

  // --- Add Activity Logic ---
  const handleAddActivity = () => {
    if (!newActivityNote.trim() || !contact) return;

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: newActivityNote.trim(),
    };

    const updatedActivities = [...(contact.activities || []), newActivity];
    const updatedContact = { ...contact, activities: updatedActivities };

    setContact(updatedContact);
    setNewActivityNote(""); // Clear input field

    // Simulate updating the master list (initialContacts)
    const contactIndex = initialContacts.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      initialContacts[contactIndex] = {
        ...initialContacts[contactIndex],
        activities: updatedActivities,
      };
    }
    showSnackbar("Activity added!", "success");
  };

  if (contact === undefined) {
    return <Loading message="Loading contact details..." />;
  }

  if (!contact) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5">Contact Not Found</Typography>
        <Button
          component={Link}
          href="/app/contacts"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Back to Contacts
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton
          component={Link}
          href="/app/contacts"
          aria-label="back to contacts"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {contact.name}
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
        {/* Contact Info Section */}
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
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </Avatar>
            <Typography
              variant="h5"
              component="div"
              gutterBottom
              align="center"
            >
              {contact.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {contact.company || "No company information"}
            </Typography>
            <Divider sx={{ my: 2, width: "100%" }} />
            <Box sx={{ width: "100%" }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Email:</strong> {contact.email}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Phone:</strong> {contact.phone || "N/A"}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Address:</strong> {contact.address || "N/A"}
              </Typography>
            </Box>
            {contact.tags && contact.tags.length > 0 && (
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {contact.tags.map((tag) => (
                  <Chip label={tag} key={tag} size="small" />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Activity & Notes Section */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-line" }}
            >
              {contact.notes || "No notes for this contact."}
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity History
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
                disabled={!newActivityNote.trim()}
              >
                Add
              </Button>
            </Box>
            {!contact.activities || contact.activities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No activities recorded yet.
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                {contact.activities
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
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
                          activity.timestamp,
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

      {/* Edit Contact Dialog */}
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
            name="name"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.name || ""}
            onChange={handleEditFormChange}
            error={!!editFormErrors.name}
            helperText={editFormErrors.name}
            sx={{ mb: 2, mt: 1 }}
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
            name="phone"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={editFormData.phone || ""}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="company"
            label="Company"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.company || ""}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.address || ""}
            onChange={handleEditFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="notes"
            label="Notes"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editFormData.notes || ""}
            onChange={handleEditFormChange}
          />
          {/* TODO: Add input for tags if needed */}
        </DialogContent>
        <DialogActions sx={{ p: "16px 24px" }}>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateContactDetails} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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
