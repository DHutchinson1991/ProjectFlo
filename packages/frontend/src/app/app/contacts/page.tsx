"use client";

import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Loading from "../../components/Loading";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface Contact {
  id: string; // Using string for ID, can be number if preferred
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

const initialContacts: Contact[] = [
  {
    id: "1",
    name: "Alice Wonderland",
    email: "alice@example.com",
    phone: "555-0101",
    company: "Mad Hatter Inc.",
  },
  {
    id: "2",
    name: "Bob The Builder",
    email: "bob@example.com",
    phone: "555-0102",
    company: "BuildIt LLC",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "555-0103",
    company: "Peanuts Corp.",
  },
];

export default function ContactsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  // Add Dialog State
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [addFormErrors, setAddFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  // Edit Dialog State
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editFormErrors, setEditFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  // Delete Dialog State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Snackbar State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<AlertColor>("success");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Shorter loading for contacts page
    return () => clearTimeout(timer);
  }, []);

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

  // --- Add Contact Logic ---
  const handleClickOpenAddDialog = () => {
    setNewContact({ name: "", email: "", phone: "", company: "" });
    setAddFormErrors({});
    setOpenAddDialog(true);
  };
  const handleCloseAddDialog = () => setOpenAddDialog(false);

  const validateAddForm = (): boolean => {
    const errors: { name?: string; email?: string } = {};
    if (!newContact.name?.trim()) errors.name = "Name is required";
    if (!newContact.email?.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newContact.email))
      errors.email = "Invalid email format";
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddContact = () => {
    if (!validateAddForm()) return;
    const newId = (
      Math.max(...contacts.map((c) => parseInt(c.id, 10)), 0) + 1
    ).toString();
    setContacts([...contacts, { ...newContact, id: newId } as Contact]);
    showSnackbar("Contact added successfully!", "success");
    handleCloseAddDialog();
  };

  // --- Edit Contact Logic ---
  const handleClickOpenEditDialog = (contact: Contact) => {
    setEditingContact({ ...contact });
    setEditFormErrors({});
    setOpenEditDialog(true);
  };
  const handleCloseEditDialog = () => setOpenEditDialog(false);

  const validateEditForm = (): boolean => {
    const errors: { name?: string; email?: string } = {};
    if (!editingContact?.name?.trim()) errors.name = "Name is required";
    if (!editingContact?.email?.trim()) errors.email = "Email is required";
    else if (
      editingContact?.email &&
      !/\S+@\S+\.\S+/.test(editingContact.email)
    )
      errors.email = "Invalid email format";
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateContact = () => {
    if (!editingContact || !validateEditForm()) return;
    setContacts(
      contacts.map((c) => (c.id === editingContact.id ? editingContact : c)),
    );
    showSnackbar("Contact updated successfully!", "success");
    handleCloseEditDialog();
  };

  // --- Delete Contact Logic ---
  const handleClickOpenDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setOpenDeleteDialog(true);
  };
  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);

  const handleConfirmDeleteContact = () => {
    if (!contactToDelete) return;
    setContacts(contacts.filter((c) => c.id !== contactToDelete.id));
    showSnackbar("Contact deleted successfully!", "success");
    handleCloseDeleteDialog();
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    formType: "add" | "edit",
  ) => {
    const { name, value } = event.target;
    if (formType === "add") {
      setNewContact((prev) => ({ ...prev, [name]: value }));
      if (addFormErrors[name as keyof typeof addFormErrors]) {
        setAddFormErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    } else if (formType === "edit" && editingContact) {
      setEditingContact((prev) => (prev ? { ...prev, [name]: value } : null));
      if (editFormErrors[name as keyof typeof editFormErrors]) {
        setEditFormErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  if (isLoading) {
    return <Loading message="Loading contacts..." />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Contacts
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleClickOpenAddDialog}
        >
          Add New Contact
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage your client contacts and information.
      </Typography>

      <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 3, overflow: "hidden" }}>
        <TableContainer
          sx={{
            maxHeight: { xs: "calc(100vh - 280px)", sm: "calc(100vh - 250px)" },
          }}
        >
          <Table stickyHeader aria-label="contacts table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Phone
                </TableCell>
                <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                  Company
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow hover key={contact.id}>
                  <TableCell component="th" scope="row">
                    {contact.name}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {contact.phone || "-"}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    {contact.company || "-"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleClickOpenEditDialog(contact)}
                      aria-label="edit contact"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleClickOpenDeleteDialog(contact)}
                      aria-label="delete contact"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Contact Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Contact</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newContact.name}
            onChange={(e) => handleFormChange(e, "add")}
            error={!!addFormErrors.name}
            helperText={addFormErrors.name}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newContact.email}
            onChange={(e) => handleFormChange(e, "add")}
            error={!!addFormErrors.email}
            helperText={addFormErrors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="phone"
            label="Phone Number (Optional)"
            type="tel"
            fullWidth
            variant="outlined"
            value={newContact.phone}
            onChange={(e) => handleFormChange(e, "add")}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="company"
            label="Company (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newContact.company}
            onChange={(e) => handleFormChange(e, "add")}
          />
        </DialogContent>
        <DialogActions sx={{ p: "16px 24px" }}>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddContact} variant="contained">
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <Dialog
          open={openEditDialog}
          onClose={handleCloseEditDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Full Name"
              type="text"
              fullWidth
              variant="outlined"
              value={editingContact.name}
              onChange={(e) => handleFormChange(e, "edit")}
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
              value={editingContact.email}
              onChange={(e) => handleFormChange(e, "edit")}
              error={!!editFormErrors.email}
              helperText={editFormErrors.email}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="phone"
              label="Phone Number (Optional)"
              type="tel"
              fullWidth
              variant="outlined"
              value={editingContact.phone || ""}
              onChange={(e) => handleFormChange(e, "edit")}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="company"
              label="Company (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={editingContact.company || ""}
              onChange={(e) => handleFormChange(e, "edit")}
            />
          </DialogContent>
          <DialogActions sx={{ p: "16px 24px" }}>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleUpdateContact} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Contact Confirmation Dialog */}
      {contactToDelete && (
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Confirm Delete Contact</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete &quot;
              <strong>{contactToDelete.name}</strong>&quot;? This action cannot
              be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: "16px 24px" }}>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmDeleteContact}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
