import React from "react";
import { Box, Button, Alert, CircularProgress } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface FilmDetailStatesProps {
    loading: boolean;
    error: string | null;
    film: any;
}

export const FilmDetailStates: React.FC<FilmDetailStatesProps> = ({
    loading,
    error,
    film,
}) => {
    const router = useRouter();

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="400px"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !film) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || "Film not found"}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push("/designer/films")}
                    sx={{ mt: 2 }}
                >
                    Back to Films
                </Button>
            </Box>
        );
    }

    return null;
};
