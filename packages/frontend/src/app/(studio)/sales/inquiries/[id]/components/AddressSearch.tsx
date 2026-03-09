'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    TextField,
    Typography,
    InputAdornment,
    CircularProgress,
    Button,
    ClickAwayListener,
} from '@mui/material';
import { Search, LocationOff } from '@mui/icons-material';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export interface AddressSelection {
    display_name: string;
    lat: number;
    lng: number;
}

interface AddressSearchProps {
    value?: string;
    onSelect: (result: AddressSelection | null) => void;
    placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Nominatim geocoding (free, OpenStreetMap-based)                    */
/* ------------------------------------------------------------------ */
async function searchNominatim(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];
    const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
    });
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ProjectFlo/1.0',
            },
        },
    );
    if (!res.ok) return [];
    return res.json();
}

/* ------------------------------------------------------------------ */
/*  AddressSearch Component                                            */
/* ------------------------------------------------------------------ */
const AddressSearch: React.FC<AddressSearchProps> = ({
    value = '',
    onSelect,
    placeholder = 'Search for venue address…',
}) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external value
    useEffect(() => {
        setQuery(value);
    }, [value]);

    const handleSearch = useCallback((text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (text.length < 3) {
            setResults([]);
            setOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchNominatim(text);
                setResults(data);
                setOpen(data.length > 0);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 600); // 600ms debounce — respect Nominatim 1req/s policy
    }, []);

    const handleSelect = (result: NominatimResult) => {
        setQuery(result.display_name);
        setOpen(false);
        setResults([]);
        onSelect({
            display_name: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        });
    };

    const handleSetUnknown = () => {
        setQuery('');
        setOpen(false);
        setResults([]);
        onSelect(null);
    };

    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Box sx={{ position: 'relative' }}>
                <TextField
                    fullWidth
                    size="small"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {loading ? (
                                    <CircularProgress size={16} sx={{ color: '#64748b' }} />
                                ) : (
                                    <Search sx={{ fontSize: 18, color: '#64748b' }} />
                                )}
                            </InputAdornment>
                        ),
                        sx: {
                            bgcolor: 'rgba(15, 23, 42, 0.6)',
                            borderRadius: 2,
                            color: '#e2e8f0',
                            fontSize: '0.82rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(51, 65, 85, 0.4)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(168, 85, 247, 0.3)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#a855f7',
                            },
                        },
                    }}
                />

                {/* Results dropdown */}
                {open && results.length > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 0.5,
                            bgcolor: 'rgba(15, 23, 42, 0.97)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            borderRadius: 2,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            zIndex: 1300,
                            maxHeight: 220,
                            overflow: 'auto',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: 'rgba(100,116,139,0.3)',
                                borderRadius: 2,
                            },
                        }}
                    >
                        {results.map((r) => (
                            <Box
                                key={r.place_id}
                                onClick={() => handleSelect(r)}
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
                                    '&:last-child': { borderBottom: 'none' },
                                    '&:hover': {
                                        bgcolor: 'rgba(168, 85, 247, 0.08)',
                                    },
                                    transition: 'background 0.15s',
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.78rem',
                                        color: '#e2e8f0',
                                        lineHeight: 1.4,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {r.display_name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Set as Unknown button */}
                <Button
                    size="small"
                    onClick={handleSetUnknown}
                    startIcon={<LocationOff sx={{ fontSize: 14 }} />}
                    sx={{
                        mt: 1,
                        color: '#64748b',
                        fontSize: '0.7rem',
                        textTransform: 'none',
                        fontWeight: 500,
                        px: 1,
                        py: 0.25,
                        '&:hover': { color: '#94a3b8', bgcolor: 'rgba(100,116,139,0.08)' },
                    }}
                >
                    Set as unknown
                </Button>
            </Box>
        </ClickAwayListener>
    );
};

export default AddressSearch;
