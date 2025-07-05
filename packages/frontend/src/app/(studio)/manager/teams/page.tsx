"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
  Avatar,
  AvatarGroup,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { Loading } from "../../../components";

// Team data interface
interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  lead_id?: number;
  lead_name?: string;
  member_count: number;
  members?: TeamMember[];
  created_at: string;
  updated_at: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Partial<Team>>({
    name: "",
    description: "",
    lead_id: undefined,
  });

  // Fetch teams from backend API
  const fetchTeams = async () => {
    try {
      setLoading(true);
      // For now, use mock data since teams API might not be implemented yet
      const mockTeams: Team[] = [
        {
          id: 1,
          name: "Video Production",
          description: "Primary video production and editing team",
          lead_id: 1,
          lead_name: "John Smith",
          member_count: 5,
          members: [
            {
              id: 1,
              name: "John Smith",
              email: "john@example.com",
              role: "Lead Editor",
            },
            {
              id: 2,
              name: "Sarah Jones",
              email: "sarah@example.com",
              role: "Camera Operator",
            },
            {
              id: 3,
              name: "Mike Wilson",
              email: "mike@example.com",
              role: "Assistant Editor",
            },
          ],
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          name: "Audio Engineering",
          description: "Sound recording and audio post-production specialists",
          lead_id: 2,
          lead_name: "Lisa Brown",
          member_count: 3,
          members: [
            {
              id: 4,
              name: "Lisa Brown",
              email: "lisa@example.com",
              role: "Audio Engineer",
            },
            {
              id: 5,
              name: "Tom Davis",
              email: "tom@example.com",
              role: "Sound Mixer",
            },
          ],
          created_at: "2024-01-20T14:30:00Z",
          updated_at: "2024-01-20T14:30:00Z",
        },
        {
          id: 3,
          name: "Creative Directors",
          description: "Creative vision and project direction team",
          lead_id: 3,
          lead_name: "Emma Taylor",
          member_count: 2,
          members: [
            {
              id: 6,
              name: "Emma Taylor",
              email: "emma@example.com",
              role: "Creative Director",
            },
            {
              id: 7,
              name: "Alex Chen",
              email: "alex@example.com",
              role: "Assistant Director",
            },
          ],
          created_at: "2024-02-01T09:15:00Z",
          updated_at: "2024-02-01T09:15:00Z",
        },
      ];

      setTeams(mockTeams);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load teams on mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Filter teams based on search
  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.lead_name &&
        team.lead_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, team: Team) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeam(team);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleEditTeam = () => {
    if (selectedTeam) {
      setEditingTeam(selectedTeam);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleAddTeam = () => {
    setEditingTeam({
      name: "",
      description: "",
      lead_id: undefined,
    });
    setAddDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    try {
      // Mock save operation
      console.log("Saving team:", editingTeam);
      await fetchTeams();
      setEditDialogOpen(false);
      setAddDialogOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save team");
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      // Mock delete operation
      console.log("Deleting team:", teamId);
      await fetchTeams();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <Loading message="Loading teams..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/manager/teams" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Manager
          </MuiLink>
        </Link>
        <Typography color="text.primary">Teams</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <GroupsIcon sx={{ mr: 2, verticalAlign: "middle" }} />
          Teams Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Organize and manage your production teams and their members.
        </Typography>
      </Box>

      {/* Status Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Development Note:</strong> This page shows mock data for
          demonstration. Full teams API integration will be implemented in Phase
          2.
        </Typography>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchTeams}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTeam}
                >
                  Add Team
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Team Lead</TableCell>
                <TableCell align="center">Members</TableCell>
                <TableCell align="center">Team Preview</TableCell>
                <TableCell align="center">Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {team.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {team.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {team.lead_name ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            mr: 1,
                            fontSize: "0.75rem",
                          }}
                        >
                          {getInitials(team.lead_name)}
                        </Avatar>
                        <Typography variant="body2">
                          {team.lead_name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No lead assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PersonIcon sx={{ mr: 0.5, fontSize: 16 }} />
                      <Typography variant="body2">
                        {team.member_count}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <AvatarGroup max={4}>
                      {team.members?.slice(0, 4).map((member) => (
                        <Avatar
                          key={member.id}
                          sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                          title={member.name}
                        >
                          {getInitials(member.name)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(team.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, team)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredTeams.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {searchTerm ? "No teams match your search" : "No teams found"}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditTeam}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Team
        </MenuItem>
        <MenuItem>
          <PersonIcon sx={{ mr: 1 }} />
          Manage Members
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedTeam) {
              handleDeleteTeam(selectedTeam.id);
            }
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Team
        </MenuItem>
      </Menu>

      {/* Edit/Add Dialog */}
      <Dialog
        open={editDialogOpen || addDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setAddDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? `Edit Team: ${selectedTeam?.name}` : "Add New Team"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Name"
                value={editingTeam.name}
                onChange={(e) =>
                  setEditingTeam({ ...editingTeam, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editingTeam.description}
                onChange={(e) =>
                  setEditingTeam({
                    ...editingTeam,
                    description: e.target.value,
                  })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Member Management:</strong> Team member assignment and
                  detailed team management features will be available in Phase
                  2. Teams can be created now and members added later via the
                  backend API.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setAddDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveTeam}>
            {editDialogOpen ? "Save Changes" : "Add Team"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
