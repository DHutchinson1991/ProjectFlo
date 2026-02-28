"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    TextField,
    Stack,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBrand } from "../../../../providers/BrandProvider";
import { useFilms } from "../../../../../hooks/films/useFilms";

export default function NewFilmPage() {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const { createFilm, isLoading, error } = useFilms(currentBrand?.id);

    const [name, setName] = useState("");
    const [numCameras, setNumCameras] = useState(2);
    const [numAudio, setNumAudio] = useState(1);

    const handleSubmit = async () => {
        if (!currentBrand) return;
        if (!name.trim()) return;

        const film = await createFilm({
            name: name.trim(),
            brand_id: currentBrand.id,
            num_cameras: numCameras,
            num_audio: numAudio,
        });

        router.push(`/designer/films/${film.id}`);
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href="/designer/films"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    Back to Films
                </Button>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create New Film Template
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Build a new film with scenes and equipment configuration
                </Typography>
            </Box>

            <Card>
                <CardContent>
                    {!currentBrand && (
                        <Alert severity="info">Please select a brand before creating a film.</Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={3} sx={{ mt: 3 }}>
                        <TextField
                            label="Film Name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            fullWidth
                            disabled={!currentBrand}
                        />
                        <TextField
                            label="Number of Cameras"
                            type="number"
                            inputProps={{ min: 0 }}
                            value={numCameras}
                            onChange={(event) => setNumCameras(parseInt(event.target.value || "0", 10))}
                            disabled={!currentBrand}
                        />
                        <TextField
                            label="Number of Audio Tracks"
                            type="number"
                            inputProps={{ min: 0 }}
                            value={numAudio}
                            onChange={(event) => setNumAudio(parseInt(event.target.value || "0", 10))}
                            disabled={!currentBrand}
                        />
                        <Button
                            variant="contained"
                            disabled={!currentBrand || !name.trim() || isLoading}
                            onClick={handleSubmit}
                        >
                            {isLoading ? "Creating..." : "Create Film"}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
