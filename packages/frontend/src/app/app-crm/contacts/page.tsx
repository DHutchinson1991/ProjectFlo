// packages/frontend/src/app/crm/contacts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactsService } from "../../../lib/api-services";
import { ContactData } from "../../../lib/api-client";
import { useRouter } from "next/navigation"; // Import the router

// Material-UI Components
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  AlertColor,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select, // Added Select
  MenuItem, // Added MenuItem
  InputLabel, // Added InputLabel
  FormControl, // Added FormControl
} from "@mui/material";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../providers/AuthProvider";

// Define the shape for a new or updated contact. It's a partial of the main ContactData type.
// Make sure ContactData in lib/api-client.ts uses phone_number and company_name
// And that it sends 'type' for contact_type
type UpsertContactData = Partial<Omit<ContactData, "id"> & { type?: string }>; // Adjusted to reflect backend DTO

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const router = useRouter(); // Initialize the router
  const { user } = useAuth();

  // --- STATE MANAGEMENT ---
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(
    null,
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({ open: false, message: "", severity: "success" });

  // --- DATA FETCHING ---
  const {
    data: contacts,
    isLoading,
    isError,
    error,
  } = useQuery<ContactData[]>({
    queryKey: ["contacts"],
    queryFn: () => contactsService.getAll(),
    enabled: !!user, // Only fetch if the user is authenticated
    onSuccess: (data) => { // DEBUG: Log fetched contacts
      console.log("Fetched contacts data (expecting phone_number, company_name, type):", JSON.stringify(data, null, 2));
    },
  });

  // --- DATA MUTATIONS ---
  const createContactMutation = useMutation<ContactData, Error, UpsertContactData>({
    mutationFn: (newContact) => {
      console.log("Creating contact with data (in mutationFn):", JSON.stringify(newContact, null, 2)); // DEBUG
      return contactsService.create(newContact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showSnackbar("Contact added successfully!", "success");
      setIsAddDialogOpen(false);
    },
    onError: (err) => {
      showSnackbar(`Error: ${err.message}`, "error");
    },
  });

  const updateContactMutation = useMutation<ContactData, Error, { id: string; data: UpsertContactData }>({
    mutationFn: (variables) => {
      console.log(`Updating contact ID ${variables.id} with data (in mutationFn):`, JSON.stringify(variables.data, null, 2)); // DEBUG
      return contactsService.update(parseInt(variables.id), variables.data); // Ensure ID is a number
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showSnackbar("Contact updated successfully!", "success");
      setIsEditDialogOpen(false);
    },
    onError: (err) => {
      showSnackbar(`Error: ${err.message}`, "error");
    },
  },
  );

  const deleteContactMutation = useMutation<void, Error, string>({
    mutationFn: (id) => contactsService.delete(parseInt(id)), // Ensure ID is a number
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      showSnackbar("Contact deleted successfully!", "success");
      setIsDeleteDialogOpen(false);
    },
    onError: (err) => {
      showSnackbar(`Error: ${err.message}`, "error");
    },
  });

  // --- UI HANDLERS ---
  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenAddDialog = () => setIsAddDialogOpen(true);

  const handleOpenEditDialog = (e: React.MouseEvent, contact: ContactData) => {
    e.stopPropagation(); // Prevent row click from firing
    setSelectedContact(contact);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent, contact: ContactData) => {
    e.stopPropagation(); // Prevent row click from firing
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleRowClick = (contactId: string) => {
    router.push(`/app-crm/contacts/${contactId}`); // router.push can handle string IDs
  };

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Error fetching contacts: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" component="h1">Contacts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
          Add Contact
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage all clients, leads, and contributors in your system.
      </Typography>

      <Paper sx={{ mt: 3, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 250px)" }}>
          <Table stickyHeader aria-label="contacts table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Phone</TableCell>
                <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Company</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts?.map((contact) => (
                <TableRow
                  hover
                  key={contact.id}
                  onClick={() => handleRowClick(contact.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    {`${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {contact.phone_number || "-"} {/* UPDATED */}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    {contact.company_name || "-"} {/* UPDATED */}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleOpenEditDialog(e, contact)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => handleOpenDeleteDialog(e, contact)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- DIALOGS --- */}
      {isAddDialogOpen && (
        <ContactFormDialog
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSubmit={(data) => createContactMutation.mutate(data)}
          isSubmitting={createContactMutation.isPending}
        />
      )}
      {isEditDialogOpen && selectedContact && (
        <ContactFormDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSubmit={(data) => updateContactMutation.mutate({ id: selectedContact.id, data })}
          isSubmitting={updateContactMutation.isPending}
          initialData={selectedContact}
        />
      )}
      {isDeleteDialogOpen && selectedContact && (
        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => deleteContactMutation.mutate(selectedContact.id)} // Use selectedContact.id (string)
          contactName={`${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`}
          isDeleting={deleteContactMutation.isPending}
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// --- Helper Components for Dialogs ---

interface ContactFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpsertContactData) => void;
  isSubmitting: boolean;
  initialData?: ContactData | null;
}

function ContactFormDialog({ open, onClose, onSubmit, isSubmitting, initialData = null }: ContactFormDialogProps) {
  const [formData, setFormData] = useState<UpsertContactData>(() => ({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone_number: initialData?.phone_number || '',
    company_name: initialData?.company_name || '',
    type: initialData?.type || 'Client',
  }));

  useEffect(() => {
    if (open) {
      setFormData({
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        email: initialData?.email || '',
        phone_number: initialData?.phone_number || '',
        company_name: initialData?.company_name || '',
        type: initialData?.type || 'Client',
      });
    }
  }, [open, initialData]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const dataToSubmit: UpsertContactData = { ...formData };
    // Removed redundant renaming logic for contact_type to type
    console.log("Submitting contact form with formData (aligned with DTO):", JSON.stringify(dataToSubmit, null, 2));
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField name="first_name" label="First Name" value={formData.first_name} onChange={handleChange} required autoFocus />
          <TextField name="last_name" label="Last Name" value={formData.last_name} onChange={handleChange} />
          <TextField name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} required />
          <TextField name="phone_number" label="Phone (Optional)" value={formData.phone_number} onChange={handleChange} />
          <TextField name="company_name" label="Company (Optional)" value={formData.company_name} onChange={handleChange} />
          <FormControl fullWidth required>
            <InputLabel id="contact-type-label">Contact Type</InputLabel>
            <Select
              labelId="contact-type-label"
              id="contact-type-select"
              name="type" // Ensure name attribute is set for handleChange
              value={formData.type}
              label="Contact Type"
              onChange={handleChange}
            >
              <MenuItem value="Client_Lead">Client Lead</MenuItem>
              <MenuItem value="Client">Client</MenuItem>
              <MenuItem value="Contributor">Contributor</MenuItem>
              <MenuItem value="Vendor">Vendor</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : (initialData ? 'Save Changes' : 'Add Contact')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName: string;
  isDeleting: boolean;
}

function DeleteConfirmationDialog({ open, onClose, onConfirm, contactName, isDeleting }: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete &quot;<strong>{contactName.trim()}</strong>&quot;? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={isDeleting}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={isDeleting}> {/* MODIFIED to use onConfirm prop */}
          {isDeleting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
