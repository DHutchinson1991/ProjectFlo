"use client";

import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress"; // Added

import Loading from "../../../components/Loading";
import { contributorsService, rolesService } from "../../../../lib/api-services"; // Added rolesService
import { Contributor, Role, NewContributorData, UpdateContributorDto } from "../../../../lib/api-client"; // Added Role, NewContributorData, UpdateContributorDto

// Import extracted modal components
import InviteMemberModal from "./components/InviteMemberModal";
import EditMemberModal from "./components/EditMemberModal";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";

export default function TeamSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Contributor[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const [operationError, setOperationError] = useState<string | null>(null); // For general CUD errors

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Added for edit modal
  const [editingMember, setEditingMember] = useState<Contributor | null>(null); // Added for member being edited
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Added for delete modal
  const [deletingMember, setDeletingMember] = useState<Contributor | null>(null); // Added for member being deleted

  const fetchMembersAndRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedMembers, fetchedRoles] = await Promise.all([
        contributorsService.getAll(),
        rolesService.getAll(),
      ]);
      console.log("Fetched Members:", JSON.stringify(fetchedMembers, null, 2)); // DEBUG: Log fetched members
      setMembers(fetchedMembers);
      setRoles(fetchedRoles);
    } catch (err) {
      console.error("Failed to fetch team members or roles:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // Added useCallback and empty dependency array

  useEffect(() => {
    fetchMembersAndRoles();
  }, [fetchMembersAndRoles]);

  // --- Invite Modal Handlers ---
  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  const handleInviteSubmit = async (data: NewContributorData) => {
    try {
      await contributorsService.create(data);
      fetchMembersAndRoles();
      // setIsInviteModalOpen(false); // Modal closes itself on successful submit
      // setOperationError(null); // Clear previous operation errors
      // Consider adding a success snackbar/toast here
    } catch (apiError) {
      console.error("Failed to invite member:", apiError);
      // setOperationError(apiError instanceof Error ? apiError.message : "Failed to invite member.");
      throw apiError; // Re-throw for the modal to handle its own error display
    }
  };

  // --- Edit Modal Handlers ---
  const handleOpenEditModal = (member: Contributor) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMember(null);
  };

  const handleEditSubmit = async (id: number, data: UpdateContributorDto) => {
    try {
      await contributorsService.update(id, data);
      fetchMembersAndRoles();
      // setIsEditModalOpen(false); // Modal closes itself on successful submit
      // setOperationError(null);
      // Consider adding a success snackbar/toast here
    } catch (apiError) {
      console.error("Failed to update member:", apiError);
      // setOperationError(apiError instanceof Error ? apiError.message : "Failed to update member.");
      throw apiError; // Re-throw for the modal to handle its own error display
    }
  };

  // --- Delete Modal Handlers ---
  const handleOpenDeleteModal = (member: Contributor) => {
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingMember(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMember) return; // Should not happen if modal is open with a member
    try {
      await contributorsService.delete(deletingMember.id);
      fetchMembersAndRoles();
      // setIsDeleteModalOpen(false); // Modal closes itself on successful confirm
      // setDeletingMember(null);
      // setOperationError(null);
      // Consider adding a success snackbar/toast here
    } catch (apiError) {
      console.error("Failed to delete member:", apiError);
      // setOperationError(apiError instanceof Error ? apiError.message : "Failed to delete member.");
      throw apiError; // Re-throw for the modal to handle its own error display or for page-level display if preferred
    }
  };

  if (isLoading && members.length === 0) { // Show initial loading only if no members yet
    return <Loading message="Loading team members and roles..." />;
  }

  if (error) { // This is for initial data fetch error
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Team Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage your team members and their roles.
      </Typography>

      {/* {operationError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOperationError(null)}>{operationError}</Alert>} */}

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
          <Typography variant="h6">Team Members</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ width: { xs: "100%", sm: "auto" } }}
            onClick={handleOpenInviteModal} // Open invite modal
          >
            Invite Member
          </Button>
        </Box>
        {isLoading && members.length > 0 && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
        {!isLoading && members.length === 0 ? (
          <Typography sx={{ textAlign: 'center', p: 2 }}>No team members found.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <TableContainer sx={{ minWidth: 650 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member: Contributor) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {((member.contact?.first_name?.[0] || "") + (member.contact?.last_name?.[0] || "")).toUpperCase() || "N/A"}
                          </Avatar>
                          <Typography variant="body2" noWrap>
                            {member.contact?.first_name || member.contact?.last_name ? `${member.contact.first_name || ""} ${member.contact.last_name || ""}`.trim() : member.contact?.email || "N/A"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{member.contact?.email || "N/A"}</TableCell>
                      <TableCell>
                        {member.role?.name ? (
                          <Chip label={member.role.name} variant="outlined" size="small" />
                        ) : ("N/A")}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1 }}>
                          <Button size="small" variant="outlined" sx={{ width: "100%" }} onClick={() => handleOpenEditModal(member)}>
                            Edit
                          </Button>
                          <Button size="small" color="error" variant="outlined" sx={{ width: "100%" }} onClick={() => handleOpenDeleteModal(member)}> {/* Changed */}
                            Remove
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        onSubmit={handleInviteSubmit}
        roles={roles}
      />

      <EditMemberModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        member={editingMember} // Pass the member being edited
        roles={roles} // Pass roles for the dropdown
      />

      <ConfirmDeleteDialog
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        memberName={deletingMember ? `${deletingMember.contact?.first_name || ""} ${deletingMember.contact?.last_name || ""}`.trim() || deletingMember.contact?.email : "this member"}
      />
    </Box>
  );
}