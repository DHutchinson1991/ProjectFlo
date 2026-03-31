"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Videocam as CameraIcon,
    Mic as MicIcon,
} from "@mui/icons-material";
import type { SectionBaseProps, PublicProposalContent, PublicProposalFilm } from "@/features/workflow/proposals/types";
import { isSectionVisible, getSectionTitle } from "@/features/workflow/proposals/utils/portal/section-helpers";
import RevealBox from "./RevealBox";

const CAMERA_PATTERNS = /camera|cam|a7|a7s|a7r|a6|fx|r5|r6|r7|c70|c200|c300|c500|bmpcc|blackmagic|red|arri|gh[5-7]|s5|s1|lumix|zcam|z\s?cam|dji|pocket|eos|canon|sony|nikon|panasonic|fuji|xa60|xa[0-9]/i;
const MIC_PATTERNS = /mic|microphone|lav|lavalier|shotgun|wireless|audio|rode|sennheiser|zoom\s?h|go\s?ii|tascam|deity|hollyland/i;

/** Playback speed multiplier — 200× compresses e.g. 1 hour into ~18 seconds */
const PLAYBACK_SPEED = 200;
const TICK_MS = 50;

interface FilmsSectionProps extends SectionBaseProps {
    content: PublicProposalContent | null;
    films: PublicProposalFilm[];
}

interface FlatMoment {
    sceneName: string;
    sceneIndex: number;
    momentName: string;
    locationName: string | null;
    durationSec: number;
    startSec: number; // cumulative start offset
}

function formatRuntime(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    const lo = min ? Math.round(min / 60) : null;
    const hi = max ? Math.round(max / 60) : null;
    if (lo && hi && lo !== hi) return `${lo}–${hi} min`;
    return `${lo || hi} min`;
}

function formatTotalDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatFilmType(raw: string): string {
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractLocationName(loc: { name: string; address_line1?: string | null } | undefined | null): string | null {
    if (!loc) return null;
    const seg = loc.address_line1?.split(",")[0]?.trim();
    return seg && seg !== loc.name ? seg : loc.name;
}

/** Corner bracket decoration for camera viewfinder */
function ViewfinderCorners({ color }: { color: string }) {
    const sz = 10;
    const style = { position: "absolute" as const, width: sz, height: sz, borderColor: alpha(color, 0.5), borderStyle: "solid" as const };
    return (
        <>
            <Box sx={{ ...style, top: 0, left: 0, borderWidth: "1px 0 0 1px" }} />
            <Box sx={{ ...style, top: 0, right: 0, borderWidth: "1px 1px 0 0" }} />
            <Box sx={{ ...style, bottom: 0, left: 0, borderWidth: "0 0 1px 1px" }} />
            <Box sx={{ ...style, bottom: 0, right: 0, borderWidth: "0 1px 1px 0" }} />
        </>
    );
}

/** Individual film card with collapsed/expanded + auto-play */
function FilmCard({ pf, colors, isDark }: { pf: PublicProposalFilm; colors: FilmsSectionProps["colors"]; isDark: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const [elapsedSec, setElapsedSec] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const f = pf.film;
    const typeLabel = formatFilmType(f.film_type);
    const runtimeLabel = formatRuntime(f.target_duration_min, f.target_duration_max);
    const scenes = f.scenes ?? [];
    const equipment = f.equipment_assignments ?? [];

    const cameras = equipment.filter((e) => CAMERA_PATTERNS.test(e.equipment.item_name));
    const audio = equipment.filter((e) => MIC_PATTERNS.test(e.equipment.item_name));
    const cameraCount = cameras.reduce((sum, e) => sum + e.quantity, 0);
    const audioCount = audio.reduce((sum, e) => sum + e.quantity, 0);

    const totalSeconds = scenes.reduce((sum, s) => {
        if (s.duration_seconds) return sum + s.duration_seconds;
        return sum + (s.moments?.reduce((ms, m) => ms + m.duration, 0) ?? 0);
    }, 0);

    // Flatten all scenes+moments into a linear playlist with durations
    const flatMoments: FlatMoment[] = (() => {
        const result: FlatMoment[] = [];
        let cumulative = 0;
        for (const s of scenes) {
            const loc = extractLocationName(s.location_assignment?.location);
            const moments = s.moments ?? [];
            if (moments.length === 0) {
                const dur = s.duration_seconds ?? 60;
                result.push({ sceneName: s.name, sceneIndex: s.order_index, momentName: "", locationName: loc, durationSec: dur, startSec: cumulative });
                cumulative += dur;
            } else {
                for (const m of moments) {
                    result.push({ sceneName: s.name, sceneIndex: s.order_index, momentName: m.name, locationName: loc, durationSec: m.duration, startSec: cumulative });
                    cumulative += m.duration;
                }
            }
        }
        return result;
    })();

    // Find which moment the elapsed time falls in
    const currentIdx = flatMoments.findIndex((fm, i) => {
        const next = flatMoments[i + 1];
        return next ? elapsedSec < next.startSec : true;
    });
    const current = flatMoments[Math.max(0, currentIdx)] ?? null;

    // Smooth progress fraction
    const progressFrac = totalSeconds > 0 ? Math.min(elapsedSec / totalSeconds, 1) : 0;

    // Continuous timer — ticks every TICK_MS, advances elapsed by TICK_MS * PLAYBACK_SPEED
    useEffect(() => {
        if (totalSeconds <= 0) return;
        const advancePerTick = (TICK_MS / 1000) * PLAYBACK_SPEED;
        timerRef.current = setInterval(() => {
            setElapsedSec((prev) => {
                const next = prev + advancePerTick;
                return next >= totalSeconds ? 0 : next; // loop
            });
        }, TICK_MS);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [totalSeconds]);

    const handleToggle = () => {
        setExpanded((prev) => !prev);
    };

    return (
        <Box
            onClick={handleToggle}
            sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                width: expanded ? "100%" : "55%",
                mx: "auto",
                "&:hover": { opacity: expanded ? 1 : 0.9 },
            }}
        >
            {/* Film title above screen */}
            <Box sx={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                width: "100%", px: 0.5, mb: 0.5,
            }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: expanded ? "0.88rem" : "0.72rem", transition: "font-size 0.3s" }}>
                        {f.name}
                    </Typography>
                    <Typography sx={{ color: alpha("#fff", 0.4), fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 500 }}>
                        {typeLabel}
                    </Typography>
                </Box>
                {runtimeLabel && (
                    <Typography sx={{ color: alpha("#fff", 0.35), fontSize: "0.58rem", fontWeight: 500 }}>
                        {runtimeLabel}
                    </Typography>
                )}
            </Box>

            {/* 16:9 cinematic screen — always rendered, just smaller/larger */}
            <Box sx={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%",
                bgcolor: "#0a0a0f",
                borderRadius: 2.5,
                overflow: "hidden",
                border: `1px solid ${alpha(colors.border, expanded ? 0.25 : 0.15)}`,
                transition: "border-color 0.3s",
            }}>
                <Box sx={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                }}>
                    {/* ── Top info bar: Scene · Moment · Location ── */}
                    <Box sx={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: expanded ? 2 : 1.5, px: expanded ? 3 : 1.5, pt: expanded ? 2.5 : 1.5, pb: expanded ? 1.5 : 1,
                        minHeight: 0, transition: "all 0.3s",
                    }}>
                        {current && (
                            <Box key={`${current.sceneIndex}-${current.momentName}`} sx={{
                                display: "flex", alignItems: "center", gap: expanded ? 2 : 1,
                                    animation: "fadeIn 0.6s cubic-bezier(0.4,0,0.2,1)",
                                    "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
                            }}>
                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                    <Typography sx={{ fontSize: expanded ? "0.55rem" : "0.45rem", color: alpha("#fff", 0.4), textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                                        Scene {current.sceneIndex + 1}
                                    </Typography>
                                    <Typography sx={{ fontSize: expanded ? "0.9rem" : "0.65rem", color: "#fff", fontWeight: 600, transition: "font-size 0.3s" }}>
                                        {current.sceneName}
                                    </Typography>
                                </Box>
                                {current.momentName && (
                                    <>
                                        <Box sx={{ width: "1px", height: expanded ? 16 : 10, bgcolor: alpha("#fff", 0.15) }} />
                                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                            <Typography sx={{ fontSize: expanded ? "0.55rem" : "0.45rem", color: alpha("#fff", 0.4), textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                                                Moment
                                            </Typography>
                                            <Typography sx={{ fontSize: expanded ? "0.9rem" : "0.65rem", color: "#fff", fontWeight: 600, transition: "font-size 0.3s" }}>
                                                {current.momentName}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                                {current.locationName && (
                                    <>
                                        <Box sx={{ width: "1px", height: expanded ? 16 : 10, bgcolor: alpha("#fff", 0.15) }} />
                                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                                            <Typography sx={{ fontSize: expanded ? "0.55rem" : "0.45rem", color: alpha("#fff", 0.4), textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                                                Location
                                            </Typography>
                                            <Typography sx={{ fontSize: expanded ? "0.9rem" : "0.65rem", color: "#fff", fontWeight: 600, transition: "font-size 0.3s" }}>
                                                {current.locationName}
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Divider */}
                    <Box sx={{ mx: expanded ? 3 : 1.5, height: "1px", bgcolor: alpha("#fff", 0.08), transition: "margin 0.3s" }} />

                    {/* ── Camera viewfinders ── */}
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", px: expanded ? 3 : 1.5, py: expanded ? 1.5 : 1, transition: "all 0.3s" }}>
                        {cameraCount > 0 && (
                            <>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: expanded ? 1 : 0.5 }}>
                                    <CameraIcon sx={{ fontSize: expanded ? 13 : 10, color: "#4caf50" }} />
                                    <Typography sx={{ fontSize: expanded ? "0.6rem" : "0.48rem", color: "#4caf50", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        Cameras · {cameraCount}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", gap: expanded ? 1.5 : 0.75, flex: 1 }}>
                                    {cameras.map((cam, i) => (
                                        <Box key={i} sx={{
                                            flex: 1, position: "relative", borderRadius: 1,
                                            bgcolor: alpha("#fff", 0.03),
                                            border: `1px solid ${alpha("#fff", 0.06)}`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            minHeight: 0,
                                        }}>
                                            <ViewfinderCorners color="#fff" />
                                            <Box sx={{
                                                position: "absolute", top: expanded ? 6 : 4, left: "50%", transform: "translateX(-50%)",
                                                bgcolor: alpha("#4caf50", 0.15), border: `1px solid ${alpha("#4caf50", 0.3)}`,
                                                borderRadius: 1, px: expanded ? 1 : 0.5, py: 0.2,
                                            }}>
                                                <Typography sx={{ fontSize: expanded ? "0.55rem" : "0.4rem", color: "#4caf50", fontWeight: 600, whiteSpace: "nowrap" }}>
                                                    CAM {i + 1} · {cam.equipment.item_name}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: expanded ? "0.55rem" : "0.4rem", color: alpha("#fff", 0.2), textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 500 }}>
                                                Empty Frame
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}

                        {audioCount > 0 && (
                            <Box sx={{ mt: expanded ? 1.5 : 0.75 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: expanded ? 0.75 : 0.4 }}>
                                    <MicIcon sx={{ fontSize: expanded ? 13 : 10, color: "#4caf50" }} />
                                    <Typography sx={{ fontSize: expanded ? "0.6rem" : "0.48rem", color: "#4caf50", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        Audio · {audioCount}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", gap: expanded ? 1 : 0.5 }}>
                                    {audio.map((mic, i) => (
                                        <Box key={i} sx={{
                                            display: "flex", alignItems: "center", gap: 0.5,
                                            bgcolor: alpha("#4caf50", 0.1), border: `1px solid ${alpha("#4caf50", 0.2)}`,
                                            borderRadius: 1.5, px: expanded ? 1.25 : 0.75, py: expanded ? 0.4 : 0.2,
                                        }}>
                                            <MicIcon sx={{ fontSize: expanded ? 14 : 10, color: "#4caf50" }} />
                                            <Typography sx={{ fontSize: expanded ? "0.6rem" : "0.42rem", color: "#fff", fontWeight: 500 }}>
                                                Audio {i + 1} · {mic.equipment.item_name}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* ── Bottom progress bar (auto-cycling) ── */}
                    <Box sx={{
                        display: "flex", flexDirection: "column",
                        borderTop: `1px solid ${alpha("#fff", 0.06)}`,
                        bgcolor: alpha("#000", 0.3),
                    }}>
                        {/* Progress track */}
                        <Box sx={{ height: 2, bgcolor: alpha("#fff", 0.06), position: "relative" }}>
                            <Box sx={{
                                position: "absolute", top: 0, left: 0, height: "100%",
                                width: `${progressFrac * 100}%`,
                                bgcolor: colors.accent,
                                transition: "none",
                            }} />
                        </Box>
                        <Box sx={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            gap: expanded ? 2 : 1, px: expanded ? 3 : 1.5, py: expanded ? 1 : 0.6,
                        }}>
                            <Box sx={{
                                width: 6, height: 6, borderRadius: "50%",
                                bgcolor: colors.accent,
                                animation: totalSeconds > 0 ? "pulse 1.5s infinite" : "none",
                                "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                            }} />
                            <Typography sx={{ fontSize: expanded ? "0.65rem" : "0.48rem", color: alpha("#fff", 0.5), fontFamily: "monospace", fontWeight: 500 }}>
                                {formatTotalDuration(Math.floor(elapsedSec))}
                            </Typography>
                            <Typography sx={{ fontSize: expanded ? "0.55rem" : "0.42rem", color: alpha("#fff", 0.25), fontWeight: 500 }}>
                                /
                            </Typography>
                            <Typography sx={{ fontSize: expanded ? "0.65rem" : "0.48rem", color: alpha("#fff", 0.3), fontFamily: "monospace", fontWeight: 500 }}>
                                {totalSeconds > 0 ? formatTotalDuration(totalSeconds) : (runtimeLabel || "0:00")}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default function FilmsSection({ content, films, colors, isDark }: FilmsSectionProps) {
    if (!isSectionVisible(content, "films")) return null;
    if (films.length === 0) return null;

    return (
        <RevealBox>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
                <Typography sx={{
                    color: colors.accent, textTransform: "uppercase", letterSpacing: 2,
                    fontSize: "0.62rem", fontWeight: 700, textAlign: "center",
                }}>
                    {getSectionTitle(content, "films", "Your Films")}
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                    {films.map((pf) => (
                        <FilmCard key={pf.film.id} pf={pf} colors={colors} isDark={isDark} />
                    ))}
                </Box>
            </Box>
        </RevealBox>
    );
}
