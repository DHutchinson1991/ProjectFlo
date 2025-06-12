"use client";

import React, { useState, useEffect } from "react";
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
import Loading from "../../../components/Loading";

export default function TeamSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const teamMembers = [
    {
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "active",
      avatar: "/api/placeholder/40/40",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Developer",
      status: "active",
      avatar: "/api/placeholder/40/40",
    },
    {
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "Designer",
      status: "inactive",
      avatar: "/api/placeholder/40/40",
    },
  ];

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Simulate a 1.5 second loading time
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loading message="Loading team members..." />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Team Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage your team members and their roles.
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
        {" "}
        {/* Adjusted padding for xs screens */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" }, // Stack on xs, row on sm and up
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" }, // Align items for stacked/row layout
            mb: 3,
            gap: { xs: 2, sm: 0 }, // Add gap for stacked layout
          }}
        >
          <Typography variant="h6">Team Members</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {" "}
            {/* Full width on xs */}
            Invite Member
          </Button>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          {" "}
          {/* Added Box for horizontal scrolling */}
          <TableContainer sx={{ minWidth: 650 }}>
            {" "}
            {/* Ensure TableContainer itself doesn't shrink too much, forcing scroll */}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamMembers.map((member, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {" "}
                        {/* Reduced gap slightly */}
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </Avatar>
                        <Typography variant="body2" noWrap>
                          {member.name}
                        </Typography>{" "}
                        {/* Added noWrap */}
                      </Box>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.role}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={member.status}
                        color={
                          member.status === "active" ? "success" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          gap: 1,
                        }}
                      >
                        {" "}
                        {/* Stack actions on xs screens */}
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ width: "100%" }}
                        >
                          {" "}
                          {/* Outlined for consistency, full width on xs */}
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ width: "100%" }}
                        >
                          {" "}
                          {/* Outlined for consistency, full width on xs */}
                          Remove
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>{" "}
        {/* Closing Box for horizontal scrolling */}
      </Paper>
    </Box>
  );
}
