"use client";
import React from "react";
import { Box, CircularProgress, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Close as CloseIcon, LocationOn as LocationOnIcon, Search as SearchIcon } from "@mui/icons-material";
import { ClickAwayListener } from "@mui/material";
import { C } from '../constants/wizard-config';
import { NominatimResult } from '../types';
import { formatShortAddress } from '../selectors/wizard-navigation';

interface Props {
    venueQuery: string;
    venueResults: NominatimResult[];
    venueLoading: boolean;
    venueDropdownOpen: boolean;
    setVenueDropdownOpen: (open: boolean) => void;
    handleSearch: (q: string) => void;
    handleSelect: (r: NominatimResult) => void;
    handleClear: () => void;
    switchToNoVenue: () => void;
}

export function VenueSearchMode({ venueQuery, venueResults, venueLoading, venueDropdownOpen, setVenueDropdownOpen, handleSearch, handleSelect, handleClear, switchToNoVenue }: Props) {
    return (
        <ClickAwayListener onClickAway={() => setVenueDropdownOpen(false)}>
            <Box sx={{ position: "relative" }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${alpha("#34d399", 0.12)}, ${alpha("#38bdf8", 0.08)})`, border: `1.5px solid ${alpha("#34d399", 0.15)}` }}>
                        <LocationOnIcon sx={{ fontSize: 30, color: "#34d399" }} />
                    </Box>
                </Box>
                <TextField
                    value={venueQuery}
                    placeholder="Search venue name, address, or city…"
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => venueResults.length > 0 && setVenueDropdownOpen(true)}
                    fullWidth autoFocus
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            color: C.text, borderRadius: "18px", fontSize: "1.05rem", py: 0.8, px: 1,
                            bgcolor: alpha(C.card, 0.6), backdropFilter: "blur(12px)",
                            "& fieldset": { borderColor: alpha(C.border, 0.5), borderWidth: "1.5px" },
                            "&:hover fieldset": { borderColor: alpha(C.accent, 0.4) },
                            "&.Mui-focused fieldset": { borderColor: C.accent, borderWidth: "2px" },
                        },
                    }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: alpha(C.muted, 0.5), fontSize: 22 }} /></InputAdornment>,
                        endAdornment: venueLoading ? (
                            <InputAdornment position="end"><CircularProgress size={20} sx={{ color: alpha(C.accent, 0.6) }} /></InputAdornment>
                        ) : venueQuery ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={handleClear} sx={{ color: alpha(C.muted, 0.4), "&:hover": { color: C.text } }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />
                {venueDropdownOpen && venueResults.length > 0 && (
                    <Box sx={{
                        position: "absolute", top: "100%", left: 0, right: 0, mt: 1, zIndex: 20,
                        bgcolor: alpha(C.card, 0.95), backdropFilter: "blur(20px)",
                        border: `1.5px solid ${alpha(C.accent, 0.2)}`, borderRadius: "18px",
                        maxHeight: 320, overflowY: "auto", py: 0.5,
                        boxShadow: `0 12px 40px ${alpha("#000", 0.4)}`,
                        "&::-webkit-scrollbar": { width: 5 },
                        "&::-webkit-scrollbar-thumb": { bgcolor: alpha(C.accent, 0.25), borderRadius: 3 },
                    }}>
                        {venueResults.map((r, idx) => (
                            <Box key={r.place_id} onClick={() => handleSelect(r)} sx={{
                                px: 2.5, py: 1.8, cursor: "pointer",
                                display: "flex", alignItems: "flex-start", gap: 1.8,
                                borderBottom: idx < venueResults.length - 1 ? `1px solid ${alpha(C.border, 0.12)}` : "none",
                                transition: "all 0.15s ease",
                                "&:hover": { bgcolor: alpha(C.accent, 0.08) },
                            }}>
                                <Box sx={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(C.accent, 0.08), mt: 0.2 }}>
                                    <LocationOnIcon sx={{ color: C.accent, fontSize: 20 }} />
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography sx={{ color: C.text, fontSize: "0.95rem", fontWeight: 500, lineHeight: 1.3 }}>
                                        {r.name || formatShortAddress(r)}
                                    </Typography>
                                    <Typography sx={{ color: alpha(C.muted, 0.55), fontSize: "0.78rem", mt: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {r.display_name}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
                {venueQuery.length >= 1 && venueQuery.length < 3 && !venueLoading && (
                    <Typography sx={{ color: alpha(C.muted, 0.35), fontSize: "0.78rem", mt: 1.5, textAlign: "center" }}>
                        Keep typing to search…
                    </Typography>
                )}
                {!venueQuery && (
                    <Box sx={{ mt: 3.5, textAlign: "center" }}>
                        <Typography sx={{ color: alpha(C.muted, 0.3), fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", mb: 1.5 }}>
                            Try searching for
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
                            {["Hotel name", "Church or chapel", "Restaurant", "Barn or estate"].map((hint) => (
                                <Box key={hint} sx={{ px: 2, py: 0.8, borderRadius: "12px", bgcolor: alpha(C.text, 0.03), border: `1px solid ${alpha(C.border, 0.15)}` }}>
                                    <Typography sx={{ color: alpha(C.muted, 0.4), fontSize: "0.76rem" }}>{hint}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
                <Typography onClick={switchToNoVenue} sx={{
                    color: alpha(C.muted, 0.5), fontSize: "0.82rem", fontWeight: 500,
                    mt: 3.5, textAlign: "center", cursor: "pointer", transition: "color 0.2s",
                    textDecoration: "underline", textDecorationColor: alpha(C.muted, 0.2), textUnderlineOffset: "4px",
                    "&:hover": { color: C.accent, textDecorationColor: alpha(C.accent, 0.4) },
                }}>
                    I don&apos;t have a venue yet
                </Typography>
            </Box>
        </ClickAwayListener>
    );
}
