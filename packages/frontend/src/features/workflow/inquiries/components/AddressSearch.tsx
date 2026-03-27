'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    InputAdornment,
    Button,
    ClickAwayListener,
    CircularProgress,
    TextField,
} from '@mui/material';
import { Search, LocationOff, EditOutlined } from '@mui/icons-material';
import { useAddressSearch } from '../hooks/useAddressSearch';
import type { NominatimResult } from '@/features/workflow/locations/api/geocoding.api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface AddressSelection {
    display_name: string;
    lat: number;
    lng: number;
}

interface AddressParts {
    name: string;
    street: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
}

interface AddressSearchProps {
    value?: string;
    onSelect: (result: AddressSelection | null) => void;
    placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const COUNTRIES = new Set([
    'united kingdom', 'england', 'wales', 'scotland', 'northern ireland',
    'ireland', 'united states', 'usa', 'canada', 'australia', 'france',
    'germany', 'spain', 'italy', 'netherlands',
]);

function extractParts(addr: NominatimResult['address']): AddressParts {
    if (!addr) return { name: '', street: '', city: '', county: '', postcode: '', country: '' };
    const name = addr.amenity || addr.building || addr.leisure || addr.tourism || addr.historic || addr.shop || addr.office || '';
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || '';
    const county = addr.county || '';
    const country = addr.country || '';
    return { name, street, city, county, postcode: addr.postcode || '', country };
}

/** Best-effort parse of a comma-separated address string from the DB */
function parseAddressString(raw: string): AddressParts {
    const segs = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const parts: AddressParts = { name: '', street: '', city: '', county: '', postcode: '', country: '' };
    if (segs.length === 0) return parts;

    // Pull out postcode & ALL country-like segments first
    const remaining: string[] = [];
    for (const seg of segs) {
        if (!parts.postcode && UK_POSTCODE.test(seg)) {
            parts.postcode = seg;
        } else if (COUNTRIES.has(seg.toLowerCase())) {
            // Keep the most specific country (last one wins, e.g. "United Kingdom" over "England")
            parts.country = seg;
        } else {
            remaining.push(seg);
        }
    }

    // Nominatim display_name: first segment is often a venue name, then road, city, county...
    if (remaining.length >= 4) {
        parts.name = remaining[0];
        parts.street = remaining[1];
        parts.city = remaining[2];
        parts.county = remaining.slice(3).join(', ');
    } else if (remaining.length === 3) {
        parts.street = remaining[0];
        parts.city = remaining[1];
        parts.county = remaining[2];
    } else if (remaining.length === 2) {
        parts.street = remaining[0];
        parts.city = remaining[1];
    } else if (remaining.length === 1) {
        parts.street = remaining[0];
    }

    return parts;
}

/* ------------------------------------------------------------------ */
/*  Structured address row                                             */
/* ------------------------------------------------------------------ */
function AddressRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, py: 0.15 }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#64748b', minWidth: 52, textAlign: 'right', flexShrink: 0 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#e2e8f0' }}>
                {value}
            </Typography>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  AddressSearch Component                                            */
/* ------------------------------------------------------------------ */
const AddressSearch: React.FC<AddressSearchProps> = ({
    value = '',
    onSelect,
    placeholder = 'Search for venue address…',
}) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [searching, setSearching] = useState(!value);
    const [parts, setParts] = useState<AddressParts | null>(null);
    const { results, loading } = useAddressSearch(query);

    // If value exists but no parts (loaded from DB), parse a simple fallback
    useEffect(() => {
        if (value && !parts) {
            setSearching(false);
        } else if (!value) {
            setSearching(true);
            setParts(null);
        }
    }, [value, parts]);

    useEffect(() => {
        setOpen(results.length > 0 && query.trim().length >= 3);
    }, [query, results]);

    const handleSearch = useCallback((text: string) => {
        setQuery(text);

        if (text.length < 3) {
            setOpen(false);
        }
    }, []);

    const handleSelect = (result: NominatimResult) => {
        setQuery('');
        setOpen(false);
        setSearching(false);
        setParts(extractParts(result.address));
        onSelect({
            display_name: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        });
    };

    const handleSetUnknown = () => {
        setQuery('');
        setOpen(false);
        setParts(null);
        setSearching(true);
        onSelect(null);
    };

    const handleChangeAddress = () => {
        setQuery('');
        setParts(null);
        setSearching(true);
    };

    // ── Selected / DB-loaded view ──
    if (!searching) {
        const hasStructured = parts && (parts.name || parts.street || parts.city || parts.postcode);
        return (
            <Box
                sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(51, 65, 85, 0.3)',
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.75,
                }}
            >
                {(() => {
                    const p = hasStructured ? parts : value ? parseAddressString(value) : null;
                    if (!p) return null;
                    return (
                        <Box>
                            <AddressRow label="Name" value={p.name} />
                            <AddressRow label="Street" value={p.street} />
                            <AddressRow label="City" value={p.city} />
                            <AddressRow label="County" value={p.county} />
                            <AddressRow label="Postcode" value={p.postcode} />
                            <AddressRow label="Country" value={p.country} />
                        </Box>
                    );
                })()}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Button
                        size="small"
                        onClick={handleChangeAddress}
                        startIcon={<EditOutlined sx={{ fontSize: 12 }} />}
                        sx={{
                            color: '#94a3b8',
                            fontSize: '0.68rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 0.75,
                            py: 0.15,
                            minWidth: 0,
                            '&:hover': { color: '#e2e8f0', bgcolor: 'rgba(100,116,139,0.08)' },
                        }}
                    >
                        Change
                    </Button>
                    <Button
                        size="small"
                        onClick={handleSetUnknown}
                        startIcon={<LocationOff sx={{ fontSize: 12 }} />}
                        sx={{
                            color: '#64748b',
                            fontSize: '0.68rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 0.75,
                            py: 0.15,
                            minWidth: 0,
                            '&:hover': { color: '#94a3b8', bgcolor: 'rgba(100,116,139,0.08)' },
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
                    autoFocus
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

                {/* Cancel search if there was a previous value */}
                {value && (
                    <Button
                        size="small"
                        onClick={() => setSearching(false)}
                        sx={{
                            mt: 0.5,
                            color: '#64748b',
                            fontSize: '0.68rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 0.75,
                            py: 0.15,
                            minWidth: 0,
                            '&:hover': { color: '#94a3b8', bgcolor: 'rgba(100,116,139,0.08)' },
                        }}
                    >
                        Cancel
                    </Button>
                )}
            </Box>
        </ClickAwayListener>
    );
};

export default AddressSearch;
