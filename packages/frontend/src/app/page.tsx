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
} from "@mui/material";

// --- DATA SHAPES ---
interface Contributor {
  id: number;
  name: string;
  role: string;
}

interface NewContributorData {
  name: string;
  role: string;
}

// --- API FUNCTIONS ---
const addContributor = async (newContributor: NewContributorData) => {
  const response = await fetch("http://localhost:3000/contributors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newContributor),
  });
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

const getContributors = async (): Promise<Contributor[]> => {
  const response = await fetch("http://localhost:3000/contributors");
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

export default function Home() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const queryClient = useQueryClient();

  const {
    data: contributors,
    isLoading,
    isError: isQueryError,
  } = useQuery({
    queryKey: ["contributors"],
    queryFn: getContributors,
  });

  const mutation = useMutation({
    mutationFn: addContributor,
    onSuccess: () => {
      setName("");
      setRole("");
      queryClient.invalidateQueries({ queryKey: ["contributors"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    mutation.mutate({ name, role });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        p: 3,
      }}
    >
      {/* --- FORM SECTION --- */}
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
          label="Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Role (e.g., Editor)"
          variant="outlined"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="contained"
          disabled={mutation.isPending}
          sx={{ mt: 1, p: 1.5 }}
        >
          {mutation.isPending ? (
            <CircularProgress size={24} />
          ) : (
            "Add Contributor"
          )}
        </Button>
        {mutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Contributor added!
          </Alert>
        )}
        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error: {mutation.error.message}
          </Alert>
        )}
      </Box>

      {/* --- DISPLAY LIST SECTION --- */}
      <Box sx={{ width: "100%", maxWidth: "500px" }}>
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
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {isQueryError && (
            <Alert severity="error">Error fetching contributors.</Alert>
          )}
          {contributors && (
            <List>
              {contributors.map((contributor) => (
                <ListItem key={contributor.id} disableGutters>
                  <ListItemText
                    primary={contributor.name}
                    secondary={contributor.role}
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
