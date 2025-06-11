"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// --- DATA SHAPES ---
// Role interface simplified to match backend GET /roles response
interface Role {
  id: number;
  name: string;
  description?: string | null;
}

// New interface for Contact details (as returned by backend within Contributor)
interface Contact {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  // Add other contact fields if your backend returns them and you need them
}

// Contributor interface updated to reflect backend structure (nested contact and role)
interface Contributor {
  id: number;
  contact: Contact; // Nested contact object
  role: Role; // Nested role object
  contributor_type?: string | null; // Or use the actual enum type if shared
  // password_hash is not typically sent to frontend
}

// NewContributorData updated to match backend CreateContributorDto
interface NewContributorData {
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  role_id: number;
  contributor_type?: string; // Or use the actual enum type
}

// DTO for updating a contributor (all fields optional)
interface UpdateContributorDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string; // Optional: only if changing password
  role_id?: number;
  contributor_type?: string; // Or use the actual enum type
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface UserProfile {
  id: number;
  email: string;
  roles: string[]; // Assuming roles are an array of strings (e.g., ['Admin', 'Editor'])
  // Add other fields your /auth/profile might return and you need
}

interface AuthResponse {
  access_token: string;
  user: UserProfile; // Assuming the backend login response includes the user profile
}

// --- API FUNCTIONS ---

// Helper to get authorization headers
const getAuthHeaders = (
  token: string | null,
  includeContentType: boolean = false,
): HeadersInit => {
  const headers = new Headers();
  if (includeContentType) {
    headers.append("Content-Type", "application/json");
  }
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }
  return headers;
};

const loginUser = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: getAuthHeaders(null, true), // No token needed for login, but Content-Type is
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Login failed" }));
    throw new Error(errorData.message || "Login failed");
  }
  return response.json();
};

// Modify existing API functions to accept and use the auth token
const addContributor = async ({
  newData,
  token,
}: {
  newData: NewContributorData;
  token: string | null;
}) => {
  const response = await fetch("http://localhost:3000/contributors", {
    method: "POST",
    headers: getAuthHeaders(token, true),
    body: JSON.stringify(newData),
  });
  if (!response.ok)
    throw new Error("Network response was not ok (addContributor)");
  return response.json();
};

const getContributors = async (
  token: string | null,
): Promise<Contributor[]> => {
  const response = await fetch("http://localhost:3000/contributors", {
    headers: getAuthHeaders(token),
  });
  if (!response.ok)
    throw new Error("Network response was not ok (getContributors)");
  return response.json();
};

const getRoles = async (token: string | null): Promise<Role[]> => {
  const response = await fetch("http://localhost:3000/roles", {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) throw new Error("Network response was not ok (getRoles)");
  return response.json();
};

const deleteContributorApi = async ({
  id,
  token,
}: {
  id: number;
  token: string | null;
}): Promise<void> => {
  const response = await fetch(`http://localhost:3000/contributors/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Network response was not ok" }));
    throw new Error(errorData.message || "Failed to delete contributor");
  }
};

const updateContributorApi = async ({
  id,
  data,
  token,
}: {
  id: number;
  data: UpdateContributorDto;
  token: string | null;
}): Promise<Contributor> => {
  const response = await fetch(`http://localhost:3000/contributors/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(token, true),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Network response was not ok" }));
    throw new Error(errorData.message || "Failed to update contributor");
  }
  return response.json();
};

export default function Home() {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // New state variables for the form
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>(""); // Use string for initial empty state if Select expects it
  // const [contributorType, setContributorType] = useState<contributors_type | string>(""); // Optional: For contributor_type enum

  // State for editing contributor
  const [editingContributor, setEditingContributor] =
    useState<Contributor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for edit form fields - initialize when modal opens
  const [editEmail, setEditEmail] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPassword, setEditPassword] = useState(""); // For new password
  const [editSelectedRoleId, setEditSelectedRoleId] = useState<number | string>(
    "",
  );

  const queryClient = useQueryClient();

  // Login Mutation
  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuthToken(data.access_token);
      setUserProfile(data.user);
      // Optionally, store token more persistently (e.g., localStorage, but be mindful of security)
      // localStorage.setItem('authToken', data.access_token);
      // localStorage.setItem('userProfile', JSON.stringify(data.user));
      queryClient.invalidateQueries(); // Refetch all queries after login
    },
    onError: (error) => {
      alert(`Login failed: ${error.message}`);
    },
  });

  const {
    data: contributors,
    isLoading: isLoadingContributors, // Renamed for clarity
    isError: isContributorsError, // Renamed for clarity
  } = useQuery<Contributor[], Error>({
    queryKey: ["contributors", authToken],
    queryFn: () => getContributors(authToken),
    enabled: !!authToken, // Only run if authToken is present
  });

  const {
    data: roles, // Renamed from rolesData for direct use
    isLoading: isLoadingRoles,
    isError: isRolesError,
  } = useQuery<Role[], Error>({
    queryKey: ["roles", authToken],
    queryFn: () => getRoles(authToken),
    enabled: !!authToken,
  });

  const addContributorMutation = useMutation<
    Contributor,
    Error,
    NewContributorData
  >({
    mutationFn: (newData) => addContributor({ newData, token: authToken }),
    onSuccess: () => {
      // Reset new form fields
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setSelectedRoleId("");
      // setContributorType(""); // If using this state
      queryClient.invalidateQueries({ queryKey: ["contributors", authToken] });
    },
  });

  // New mutation for deleting a contributor
  const deleteContributorMutation = useMutation<void, Error, number>({
    mutationFn: (id) => deleteContributorApi({ id, token: authToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributors", authToken] });
      // Optionally, show a success notification
    },
    onError: (error) => {
      // Optionally, show an error notification
      alert(`Error deleting contributor: ${error.message}`);
    },
  });

  const updateContributorMutation = useMutation<
    Contributor,
    Error,
    { id: number; data: UpdateContributorDto }
  >({
    mutationFn: (vars) => updateContributorApi({ ...vars, token: authToken }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contributors", authToken] });
      setIsEditModalOpen(false); // Close modal on success
      console.log("Updated contributor:", data); // Acknowledge or use the returned data
      // Optionally, show a success notification
    },
    onError: (error) => {
      // Optionally, show an error notification
      alert(`Error updating contributor: ${error.message}`);
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert("Please enter email and password.");
      return;
    }
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUserProfile(null);
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('userProfile');
    queryClient.clear(); // Clear all query cache on logout
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedRoleId) {
      // Add more robust validation as needed
      alert("Please fill in Email, Password, and Role.");
      return;
    }
    const payload: NewContributorData = {
      email,
      first_name: firstName || undefined, // Send undefined if empty, or handle in backend DTO
      last_name: lastName || undefined, // Send undefined if empty
      password,
      role_id: Number(selectedRoleId),
      // contributor_type: contributorType as contributors_type, // Cast if using enum type directly
    };
    addContributorMutation.mutate(payload); // Using the explicitly typed payload
  };

  const handleEditContributor = (id: number) => {
    const contributorToEdit = contributors?.find((c) => c.id === id);
    if (contributorToEdit) {
      setEditingContributor(contributorToEdit);
      // Pre-fill edit form state
      setEditEmail(contributorToEdit.contact.email);
      setEditFirstName(contributorToEdit.contact.first_name || "");
      setEditLastName(contributorToEdit.contact.last_name || "");
      setEditPassword(""); // Clear password field for editing
      setEditSelectedRoleId(contributorToEdit.role.id);

      setIsEditModalOpen(true);
    } else {
      alert("Could not find contributor to edit.");
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingContributor(null); // Clear editing state
  };

  const handleUpdateContributorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContributor) return;

    const payload: UpdateContributorDto = {
      email:
        editEmail !== editingContributor.contact.email ? editEmail : undefined,
      first_name:
        editFirstName !== (editingContributor.contact.first_name || "")
          ? editFirstName
          : undefined,
      last_name:
        editLastName !== (editingContributor.contact.last_name || "")
          ? editLastName
          : undefined,
      role_id:
        Number(editSelectedRoleId) !== editingContributor.role.id
          ? Number(editSelectedRoleId)
          : undefined,
      // Only include password if it's entered
      ...(editPassword && { password: editPassword }),
    };

    // Filter out undefined properties to send a clean payload
    const filteredPayload = Object.entries(payload).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as keyof UpdateContributorDto] = value;
        }
        return acc;
      },
      {} as Partial<UpdateContributorDto>,
    );

    if (Object.keys(filteredPayload).length === 0) {
      alert("No changes detected.");
      setIsEditModalOpen(false);
      return;
    }

    updateContributorMutation.mutate({
      id: editingContributor.id,
      data: filteredPayload,
    });
  };

  const handleDeleteContributor = (id: number) => {
    // Confirmation dialog
    if (window.confirm("Are you sure you want to delete this contributor?")) {
      deleteContributorMutation.mutate(id);
    }
  };

  // Conditional rendering based on authToken
  if (!authToken) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Box
          component="form"
          onSubmit={handleLoginSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 3,
            width: "100%",
            maxWidth: "350px",
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ textAlign: "center", mb: 2 }}
          >
            Login
          </Typography>
          <TextField
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? <CircularProgress size={24} /> : "Login"}
          </Button>
          {loginMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {loginMutation.error.message}
            </Alert>
          )}
        </Box>
      </Box>
    );
  }

  // Determine if the current user is an Admin
  const isAdmin = userProfile?.roles.includes("Admin");

  // Main application content (shown after login)
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        {userProfile && (
          <Typography sx={{ mr: 2 }}>
            Welcome, {userProfile.email} ({userProfile.roles.join(", ")})!
          </Typography>
        )}
        <Button variant="outlined" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* --- ADD FORM SECTION (Admin only) --- */}
      {isAdmin && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 3,
            width: "100%",
            maxWidth: "400px",
            mb: 4, // Add some margin if both form and list are present
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ textAlign: "center", mb: 2 }}
          >
            Add New Contributor
          </Typography>
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="First Name (Optional)"
            variant="outlined"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last Name (Optional)"
            variant="outlined"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <FormControl fullWidth required>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={selectedRoleId}
              label="Role"
              onChange={(e) => setSelectedRoleId(e.target.value as number)}
              disabled={isLoadingRoles}
            >
              {isLoadingRoles && (
                <MenuItem value="" disabled>
                  <em>Loading roles...</em>
                </MenuItem>
              )}
              {isRolesError && (
                <MenuItem value="" disabled>
                  <em>Error loading roles</em>
                </MenuItem>
              )}
              {!isLoadingRoles &&
                !isRolesError &&
                roles &&
                roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              {!isLoadingRoles &&
                !isRolesError &&
                (!roles || roles.length === 0) && (
                  <MenuItem value="" disabled>
                    <em>No roles available</em>
                  </MenuItem>
                )}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            disabled={addContributorMutation.isPending || isLoadingRoles}
            sx={{ mt: 1, p: 1.5 }}
          >
            {addContributorMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Add Contributor"
            )}
          </Button>
          {addContributorMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Contributor added!
            </Alert>
          )}
          {addContributorMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error: {addContributorMutation.error.message}
            </Alert>
          )}
        </Box>
      )}

      {/* --- EDIT MODAL (Logic for opening this is tied to edit button, which will be conditional) --- */}
      {editingContributor && (
        <Dialog open={isEditModalOpen} onClose={handleEditModalClose}>
          <DialogTitle>Edit Contributor</DialogTitle>
          <Box component="form" onSubmit={handleUpdateContributorSubmit}>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Update the details for{" "}
                {editingContributor.contact.first_name ||
                  editingContributor.contact.email}
                .
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="edit-email"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="edit-firstName"
                label="First Name (Optional)"
                type="text"
                fullWidth
                variant="outlined"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="edit-lastName"
                label="Last Name (Optional)"
                type="text"
                fullWidth
                variant="outlined"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="edit-password"
                label="New Password (leave blank to keep current)"
                type="password"
                fullWidth
                variant="outlined"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel id="edit-role-select-label">Role</InputLabel>
                <Select
                  labelId="edit-role-select-label"
                  id="edit-role-select"
                  value={editSelectedRoleId}
                  label="Role"
                  onChange={(e) =>
                    setEditSelectedRoleId(e.target.value as number)
                  }
                  disabled={isLoadingRoles}
                >
                  {isLoadingRoles && (
                    <MenuItem value="" disabled>
                      <em>Loading roles...</em>
                    </MenuItem>
                  )}
                  {isRolesError && (
                    <MenuItem value="" disabled>
                      <em>Error loading roles</em>
                    </MenuItem>
                  )}
                  {roles &&
                    roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: "0 24px 24px 24px" }}>
              <Button onClick={handleEditModalClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={updateContributorMutation.isPending}
              >
                {updateContributorMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}

      {/* --- DISPLAY LIST SECTION --- */}
      <Box sx={{ width: "100%", maxWidth: "600px" }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{ textAlign: "center", mb: 2 }}
        >
          Current Contributors
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          {isLoadingContributors && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {isContributorsError && (
            <Alert severity="error">Error fetching contributors.</Alert>
          )}
          {contributors && (
            <List>
              {contributors.map((contributor) => (
                <ListItem
                  key={contributor.id}
                  disableGutters
                  secondaryAction={
                    isAdmin ? (
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEditContributor(contributor.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() =>
                            handleDeleteContributor(contributor.id)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ) : null // No actions if not admin
                  }
                >
                  <ListItemText
                    primary={
                      `${contributor.contact.first_name || ""} ${contributor.contact.last_name || ""}`.trim() ||
                      contributor.contact.email
                    }
                    secondary={
                      contributor.role
                        ? contributor.role.name
                        : "Role not specified"
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Box>
  );
}
