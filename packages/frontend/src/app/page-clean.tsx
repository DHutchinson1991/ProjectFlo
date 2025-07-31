"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import {
    Role,
    Contributor,
    Contact,
    NewContributorData,
    UpdateContributorDto,
    LoginCredentials,
    UserProfile,
    AuthResponse
} from "@/lib/types";
import { api, authService } from "@/lib/api";

export default function Home() {
    // Auth state
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Form state for adding contributors
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState<number | string>("");

    // State for editing contributor
    const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editEmail, setEditEmail] = useState("");
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editSelectedRoleId, setEditSelectedRoleId] = useState<number | string>("");

    const queryClient = useQueryClient();

    // Load auth token from localStorage on mount
    useEffect(() => {
        // Get token from authService instead of localStorage
        const storedToken = authService.getToken();
        const storedProfile = localStorage.getItem('userProfile');
        if (storedToken && storedProfile) {
            setAuthToken(storedToken);
            setUserProfile(JSON.parse(storedProfile));
            // Use authService instead of direct api call
            authService.setToken(storedToken);
        }
    }, []);

    // Login Mutation using unified API
    const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
        mutationFn: (credentials) => authService.login(credentials),
        onSuccess: (data) => {
            setAuthToken(data.access_token);
            setUserProfile(data.user);
            // Use authService to set token
            authService.setToken(data.access_token);
            // Only store userProfile in localStorage since authService handles token storage
            localStorage.setItem('userProfile', JSON.stringify(data.user));
            queryClient.invalidateQueries();
        },
        onError: (error) => {
            alert(`Login failed: ${error.message}`);
        },
    });

    // Queries using unified API
    const {
        data: contributors,
        isLoading: isLoadingContributors,
        isError: isContributorsError,
    } = useQuery<Contributor[], Error>({
        queryKey: ["contributors", authToken],
        queryFn: () => api.contributors.getAll(),
        enabled: !!authToken,
    });

    const {
        data: roles,
        isLoading: isLoadingRoles,
        isError: isRolesError,
    } = useQuery<Role[], Error>({
        queryKey: ["roles", authToken],
        queryFn: () => api.roles.getAll(),
        enabled: !!authToken,
    });

    // Contacts using unified API (brand context automatically included)
    const {
        data: contacts,
        isLoading: isLoadingContacts,
        isError: isContactsError,
    } = useQuery<Contact[], Error>({
        queryKey: ["contacts", authToken],
        queryFn: () => api.contacts.getAll(),
        enabled: !!authToken,
    });

    // Mutations using unified API
    const addContributorMutation = useMutation<Contributor, Error, NewContributorData>({
        mutationFn: (newData) => api.contributors.create(newData),
        onSuccess: () => {
            setEmail("");
            setFirstName("");
            setLastName("");
            setPassword("");
            setSelectedRoleId("");
            queryClient.invalidateQueries({ queryKey: ["contributors", authToken] });
        },
    });

    const deleteContributorMutation = useMutation<void, Error, number>({
        mutationFn: (id) => api.contributors.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contributors", authToken] });
        },
        onError: (error) => {
            alert(`Error deleting contributor: ${error.message}`);
        },
    });

    const updateContributorMutation = useMutation<
        Contributor,
        Error,
        { id: number; data: UpdateContributorDto }
    >({
        mutationFn: ({ id, data }) => api.contributors.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contributors", authToken] });
            setIsEditModalOpen(false);
        },
        onError: (error) => {
            alert(`Error updating contributor: ${error.message}`);
        },
    });

    // Event handlers
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
        // Use authService to clear token
        authService.setToken(null);
        // Only need to clear userProfile from localStorage since authService handles token storage
        localStorage.removeItem('userProfile');
        queryClient.clear();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !selectedRoleId) {
            alert("Please fill in Email, Password, and Role.");
            return;
        }
        const payload: NewContributorData = {
            email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            password,
            role_id: Number(selectedRoleId),
        };
        addContributorMutation.mutate(payload);
    };

    const handleEditContributor = (id: number) => {
        const contributorToEdit = contributors?.find((c) => c.id === id);
        if (contributorToEdit) {
            setEditingContributor(contributorToEdit);
            setEditEmail(contributorToEdit.contact.email);
            setEditFirstName(contributorToEdit.contact.first_name || "");
            setEditLastName(contributorToEdit.contact.last_name || "");
            setEditPassword("");
            setEditSelectedRoleId(contributorToEdit.role?.id || 0);
            setIsEditModalOpen(true);
        } else {
            alert("Could not find contributor to edit.");
        }
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingContributor(null);
    };

    const handleUpdateContributorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContributor) return;

        const payload: UpdateContributorDto = {
            email: editEmail !== editingContributor.contact.email ? editEmail : undefined,
            first_name: editFirstName !== (editingContributor.contact.first_name || "") ? editFirstName : undefined,
            last_name: editLastName !== (editingContributor.contact.last_name || "") ? editLastName : undefined,
            role_id: Number(editSelectedRoleId) !== editingContributor.role?.id ? Number(editSelectedRoleId) : undefined,
            ...(editPassword && { password: editPassword }),
        };

        // Filter out undefined properties
        const filteredPayload = Object.entries(payload).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key as keyof UpdateContributorDto] = value;
            }
            return acc;
        }, {} as Partial<UpdateContributorDto>);

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
        if (window.confirm("Are you sure you want to delete this contributor?")) {
            deleteContributorMutation.mutate(id);
        }
    };

    // Render login form if not authenticated
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
                    <Typography variant="h5" component="h1" sx={{ textAlign: "center", mb: 2 }}>
                        ProjectFlo Wedding Video Business
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: "center", mb: 2, color: "text.secondary" }}>
                        Team Member Login
                    </Typography>
                    <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                            Test Credentials:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                            <strong>Admin:</strong> info@dhutchinson.co.uk / password
                            <br />
                            <strong>Lead Videographer:</strong> sarah.films@example.com / weddingpass1
                            <br />
                            <strong>Editor:</strong> mark.edits@example.com / editmaster22
                            <br />
                            <strong>Client Manager:</strong> emily.clients@example.com / clientlove3
                        </Typography>
                    </Box>
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
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 3 }}>
            <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end", mb: 2 }}>
                {userProfile && (
                    <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" sx={{ color: "primary.main", mb: 0.5 }}>
                            🎬 ProjectFlo Wedding Videos
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Welcome, {userProfile.email} • {userProfile.roles.join(", ")}
                        </Typography>
                    </Box>
                )}
                <Button variant="outlined" onClick={handleLogout}>
                    Logout
                </Button>
            </Box>

            {/* Add Contributor Form (Admin only) */}
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
                        mb: 4,
                    }}
                >
                    <Typography variant="h5" component="h1" sx={{ textAlign: "center", mb: 1 }}>
                        Add Team Member
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: "center", mb: 3, color: "text.secondary" }}>
                        Add videographers, editors, and other crew members to your wedding video production team
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
                            {!isLoadingRoles && !isRolesError && roles && roles.map((role) => (
                                <MenuItem key={role.id} value={role.id}>
                                    {role.name}
                                </MenuItem>
                            ))}
                            {!isLoadingRoles && !isRolesError && (!roles || roles.length === 0) && (
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
                            "Add Team Member"
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

            {/* Edit Modal */}
            {editingContributor && (
                <Dialog open={isEditModalOpen} onClose={handleEditModalClose}>
                    <DialogTitle>Edit Contributor</DialogTitle>
                    <Box component="form" onSubmit={handleUpdateContributorSubmit}>
                        <DialogContent>
                            <DialogContentText sx={{ mb: 2 }}>
                                Update the details for {editingContributor.contact.first_name || editingContributor.contact.email}.
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
                                    onChange={(e) => setEditSelectedRoleId(e.target.value as number)}
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
                                    {roles && roles.map((role) => (
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

            {/* Contributors List */}
            <Box sx={{ width: "100%", maxWidth: "600px" }}>
                <Typography variant="h5" component="h2" sx={{ textAlign: "center", mb: 2 }}>
                    🎥 Wedding Video Production Team
                </Typography>
                <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, boxShadow: 3 }}>
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
                                                    onClick={() => handleDeleteContributor(contributor.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Stack>
                                        ) : null
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Typography component="div" sx={{ fontWeight: "medium" }}>
                                                {`${contributor.contact.first_name || ""} ${contributor.contact.last_name || ""}`.trim() ||
                                                    contributor.contact.email}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.primary">
                                                    {contributor.role?.name || "Role not specified"}
                                                    {contributor.contributor_type && ` • ${contributor.contributor_type}`}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    📧 {contributor.contact.email}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Box>

            {/* Contacts Overview */}
            <Box sx={{ width: "100%", maxWidth: "600px", mt: 4 }}>
                <Typography variant="h5" component="h2" sx={{ textAlign: "center", mb: 2 }}>
                    📇 Wedding Business Contacts
                </Typography>
                <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, boxShadow: 3 }}>
                    {isLoadingContacts && (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {isContactsError && (
                        <Alert severity="error">Error fetching contacts.</Alert>
                    )}
                    {contacts && (
                        <List>
                            {contacts.map((contact) => (
                                <ListItem key={contact.id} disableGutters>
                                    <ListItemText
                                        primary={
                                            <Typography component="div" sx={{ fontWeight: "medium" }}>
                                                {`${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.primary">
                                                    {contact.type}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    📧 {contact.email}
                                                </Typography>
                                            </Box>
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
