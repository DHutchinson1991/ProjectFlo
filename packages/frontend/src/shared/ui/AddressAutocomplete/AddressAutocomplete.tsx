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
import { alpha } from '@mui/material/styles';
import { Search, LocationOff, EditOutlined } from '@mui/icons-material';
import {
    searchNominatim,
    type NominatimResult,
} from '@/features/workflow/locations/api/geocoding.api';

export type { NominatimResult };

export interface AddressResult {
    display_name: string;
    lat: number;
    lng: number;
    name?: string;
    street?: string;
    city?: string;
    county?: string;
    postcode?: string;
    country?: string;
}

export interface AddressAutocompleteColors {
    bg: string;
    card: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
}

interface AddressAutocompleteProps {
    value?: string;
    onSelect: (result: AddressResult | null) => void;
    placeholder?: string;
    colors: AddressAutocompleteColors;
    error?: string;
    fieldSx?: object;
}

function extractParts(addr: NominatimResult['address']) {
    if (!addr) return { name: '', street: '', city: '', county: '', postcode: '', country: '' };
    const name = addr.amenity || addr.building || addr.leisure || addr.tourism || addr.historic || addr.shop || addr.office || '';
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || '';
    const county = addr.county || '';
    const country = addr.country || '';
    return { name, street, city, county, postcode: addr.postcode || '', country };
}

/* ------------------------------------------------------------------ */
/*  Structured address row                                             */
/* ------------------------------------------------------------------ */
function AddressRow({ label, value, colors }: { label: string; value: string; colors: AddressAutocompleteColors }) {
    if (!value) return null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, py: 0.15 }}>
            <Typography sx={{ fontSize: '0.68rem', color: colors.muted, minWidth: 52, textAlign: 'right', flexShrink: 0 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: colors.text }}>
                {value}
            </Typography>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  AddressAutocomplete                                                */
/* ------------------------------------------------------------------ */
const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value = '',
    onSelect,
    placeholder = 'Search for address…',
    colors,
    error,
    fieldSx,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(!value);
    const [selectedParts, setSelectedParts] = useState<ReturnType<typeof extractParts> | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (value && !selectedParts) {
            setSearching(false);
        } else if (!value) {
            setSearching(true);
            setSelectedParts(null);
        }
    }, [value, selectedParts]);

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
        }, 600);
    }, []);

    const handleSelect = (result: NominatimResult) => {
        setQuery('');
        setOpen(false);
        setResults([]);
        setSearching(false);
        const parts = extractParts(result.address);
        setSelectedParts(parts);
        onSelect({
            display_name: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            ...parts,
        });
    };

    const handleClear = () => {
        setQuery('');
        setOpen(false);
        setResults([]);
        setSelectedParts(null);
        setSearching(true);
        onSelect(null);
    };

    const handleChange = () => {
        setQuery('');
        setSelectedParts(null);
        setSearching(true);
    };

    // ── Selected view ──
    if (!searching && value) {
        const parts = selectedParts || { name: '', street: '', city: '', county: '', postcode: '', country: '' };
        const hasParts = parts.name || parts.street || parts.city || parts.postcode;
        return (
            <Box
                sx={{
                    bgcolor: alpha(colors.card, 0.5),
                    border: `1px solid ${alpha(colors.border, 0.6)}`,
                    borderRadius: '12px',
                    px: 2,
                    py: 1.5,
                }}
            >
                {hasParts ? (
                    <Box>
                        <AddressRow label="Name" value={parts.name || ''} colors={colors} />
                        <AddressRow label="Street" value={parts.street} colors={colors} />
                        <AddressRow label="City" value={parts.city} colors={colors} />
                        <AddressRow label="County" value={parts.county} colors={colors} />
                        <AddressRow label="Postcode" value={parts.postcode} colors={colors} />
                        <AddressRow label="Country" value={parts.country} colors={colors} />
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: '0.82rem', color: colors.text }}>{value}</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    <Button
                        size="small"
                        onClick={handleChange}
                        startIcon={<EditOutlined sx={{ fontSize: 12 }} />}
                        sx={{
                            color: colors.muted,
                            fontSize: '0.68rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 0.75,
                            py: 0.15,
                            minWidth: 0,
                            '&:hover': { color: colors.text, bgcolor: alpha(colors.accent, 0.08) },
                        }}
                    >
                        Change
                    </Button>
                    <Button
                        size="small"
                        onClick={handleClear}
                        startIcon={<LocationOff sx={{ fontSize: 12 }} />}
                        sx={{
                            color: alpha(colors.muted, 0.7),
                            fontSize: '0.68rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 0.75,
                            py: 0.15,
                            minWidth: 0,
                            '&:hover': { color: colors.muted, bgcolor: alpha(colors.accent, 0.08) },
                        }}
                    >
                        Clear
                    </Button>
                </Box>
            </Box>
        );
    }

    // ── Search view ──
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
                    error={Boolean(error)}
                    helperText={error}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {loading ? (
                                    <CircularProgress size={16} sx={{ color: colors.muted }} />
                                ) : (
                                    <Search sx={{ fontSize: 18, color: colors.muted }} />
                                )}
                            </InputAdornment>
                        ),
                        sx: {
                            ...(fieldSx || {}),
                            color: colors.text,
                            bgcolor: alpha(colors.card, 0.5),
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(colors.border, 0.6),
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: alpha(colors.accent, 0.4),
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accent,
                                borderWidth: '1.5px',
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
                            bgcolor: colors.card,
                            border: `1px solid ${alpha(colors.border, 0.7)}`,
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            zIndex: 1300,
                            maxHeight: 220,
                            overflow: 'auto',
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: alpha(colors.muted, 0.3),
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
                                    borderBottom: `1px solid ${alpha(colors.border, 0.3)}`,
                                    '&:last-child': { borderBottom: 'none' },
                                    '&:hover': {
                                        bgcolor: alpha(colors.accent, 0.08),
                                    },
                                    transition: 'background 0.15s',
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: '0.78rem',
                                        color: colors.text,
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

                {/* Cancel search if there was a previous value */}
                {value && (
                    <Button
                        size="small"
                        onClick={() => setSearching(false)}
                        sx={{
                            mt: 0.5,
                            color: colors.muted,
                            fontSize: '0.68rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 0.75,
                            py: 0.15,
                            minWidth: 0,
                            '&:hover': { color: colors.text, bgcolor: alpha(colors.accent, 0.08) },
                        }}
                    >
                        Cancel
                    </Button>
                )}
            </Box>
        </ClickAwayListener>
    );
};

export default AddressAutocomplete;
