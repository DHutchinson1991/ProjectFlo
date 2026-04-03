"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    type MotionValue,
    type Variants,
} from "framer-motion";
import type { SectionBaseProps, PublicProposalPhase, PublicProposalTaskDetail } from "@/features/workflow/proposals/types";
import { PHASE_CUSTOMER_DESCRIPTIONS } from "@/shared/ui/tasks";

interface ProjectPhasesSectionProps extends SectionBaseProps {
    phases: PublicProposalPhase[];
}

/* ── Phase config ───────────────────────────────────────────────── */
const PHASE_META: Record<string, {
    label: string;
    description: string;
    color: string;
    glowColor: string;
    order: number;
}> = {
    Creative_Development: {
        label: "Creative Development",
        description: PHASE_CUSTOMER_DESCRIPTIONS.Creative_Development ?? "Concept planning, mood boards, and creative vision for your film.",
        color: "#4ade80",
        glowColor: "#22c55e",
        order: 0,
    },
    Pre_Production: {
        label: "Pre-Production",
        description: PHASE_CUSTOMER_DESCRIPTIONS.Pre_Production ?? "Scheduling, shot planning, and logistics preparation.",
        color: "#34d399",
        glowColor: "#10b981",
        order: 1,
    },
    Production: {
        label: "Production",
        description: PHASE_CUSTOMER_DESCRIPTIONS.Production ?? "On-site filming and live event coverage.",
        color: "#38bdf8",
        glowColor: "#0ea5e9",
        order: 2,
    },
    Post_Production: {
        label: "Post Production",
        description: PHASE_CUSTOMER_DESCRIPTIONS.Post_Production ?? "Editing, color grading, sound design, and visual effects.",
        color: "#a78bfa",
        glowColor: "#8b5cf6",
        order: 3,
    },
    Delivery: {
        label: "Delivery",
        description: PHASE_CUSTOMER_DESCRIPTIONS.Delivery ?? "Final review, revisions, and delivery of your finished films.",
        color: "#c084fc",
        glowColor: "#a855f7",
        order: 4,
    },
};

const EXCLUDED_PHASES = new Set(["Lead", "Inquiry", "Booking"]);

/* ═══════════════════════════════════════════════════════════════════ */
/* Animated phase graphics (procedural SVG with Framer Motion)        */
/* ═══════════════════════════════════════════════════════════════════ */

/** Creative Development — brainstorming lightbulb with floating thought bubbles */
function CreativeGraphic({ color, glow, active }: { color: string; glow: string; active: boolean }) {
    return (
        <svg viewBox="0 0 120 120" width="160" height="160" style={{ overflow: "visible" }}>
            <defs>
                <filter id="cg-glow">
                    <feGaussianBlur stdDeviation="4" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="cg-soft">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>
            {/* Ambient glow behind bulb */}
            <motion.circle
                cx="60" cy="52" r="32"
                fill={alpha(glow, 0.08)}
                filter="url(#cg-soft)"
                initial={{ scale: 0, opacity: 0 }}
                animate={active ? { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "60px 52px" }}
            />
            {/* Lightbulb glass */}
            <motion.path
                d="M 60 18 C 42 18, 30 32, 30 48 C 30 58, 36 66, 46 72 L 46 82 L 74 82 L 74 72 C 84 66, 90 58, 90 48 C 90 32, 78 18, 60 18 Z"
                fill="none" stroke={color} strokeWidth={2}
                filter="url(#cg-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={active ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Bulb base lines */}
            {[86, 90, 94].map((y, i) => (
                <motion.line
                    key={i}
                    x1="48" y1={y} x2="72" y2={y}
                    stroke={alpha(color, 0.5)} strokeWidth={1.5} strokeLinecap="round"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={active ? { scaleX: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.4, delay: 1.2 + i * 0.15 }}
                    style={{ transformOrigin: `60px ${y}px` }}
                />
            ))}
            {/* Filament glow inside */}
            <motion.path
                d="M 52 55 Q 56 42, 60 55 Q 64 42, 68 55"
                fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"
                filter="url(#cg-glow)"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.4, 1, 0.4] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            />
            {/* Floating thought / idea bubbles */}
            {[
                { cx: 28, cy: 28, r: 6, delay: 0.5 },
                { cx: 18, cy: 42, r: 4, delay: 1.0 },
                { cx: 92, cy: 24, r: 5, delay: 0.8 },
                { cx: 100, cy: 38, r: 3.5, delay: 1.3 },
                { cx: 36, cy: 14, r: 3, delay: 1.6 },
            ].map((b, i) => (
                <motion.circle
                    key={i}
                    cx={b.cx} cy={b.cy} r={b.r}
                    fill="none" stroke={alpha(color, 0.4)} strokeWidth={1}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={active ? {
                        scale: [0, 1, 1, 0],
                        opacity: [0, 0.7, 0.7, 0],
                        y: [0, -8, -16, -24],
                    } : {}}
                    transition={{ duration: 4, repeat: Infinity, delay: b.delay, ease: "easeOut" }}
                    style={{ transformOrigin: `${b.cx}px ${b.cy}px` }}
                />
            ))}
            {/* Sparkle accents */}
            {[
                { x: 24, y: 20, delay: 0.3 },
                { x: 96, y: 18, delay: 0.7 },
                { x: 14, y: 56, delay: 1.1 },
                { x: 106, y: 50, delay: 1.5 },
            ].map((s, i) => (
                <motion.g key={`s-${i}`} style={{ transformOrigin: `${s.x}px ${s.y}px` }}>
                    <motion.line
                        x1={s.x - 4} y1={s.y} x2={s.x + 4} y2={s.y}
                        stroke={alpha(color, 0.6)} strokeWidth={1} strokeLinecap="round"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={active ? { scale: [0, 1, 0], opacity: [0, 0.8, 0] } : {}}
                        transition={{ duration: 2.5, repeat: Infinity, delay: s.delay }}
                        style={{ transformOrigin: `${s.x}px ${s.y}px` }}
                    />
                    <motion.line
                        x1={s.x} y1={s.y - 4} x2={s.x} y2={s.y + 4}
                        stroke={alpha(color, 0.6)} strokeWidth={1} strokeLinecap="round"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={active ? { scale: [0, 1, 0], opacity: [0, 0.8, 0] } : {}}
                        transition={{ duration: 2.5, repeat: Infinity, delay: s.delay }}
                        style={{ transformOrigin: `${s.x}px ${s.y}px` }}
                    />
                </motion.g>
            ))}
        </svg>
    );
}

/** Pre-Production — refined clipboard with progress bar and polished checklist */
function PreProdGraphic({ color, glow, active }: { color: string; glow: string; active: boolean }) {
    return (
        <svg viewBox="0 0 120 120" width="160" height="160" style={{ overflow: "visible" }}>
            <defs>
                <filter id="pp-glow">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="pp-soft">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>
            {/* Ambient backlight */}
            <motion.rect
                x="25" y="14" width="70" height="92" rx="10"
                fill={alpha(glow, 0.06)}
                filter="url(#pp-soft)"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Clipboard board */}
            <motion.rect
                x="28" y="18" width="64" height="88" rx="6"
                fill={alpha(glow, 0.04)} stroke={color} strokeWidth={1.8}
                filter="url(#pp-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={active ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Clip holder */}
            <motion.rect
                x="44" y="10" width="32" height="14" rx="4"
                fill={alpha(glow, 0.15)} stroke={color} strokeWidth={1.5}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={active ? { scaleY: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ transformOrigin: "60px 17px" }}
            />
            {/* Clip notch */}
            <motion.rect
                x="52" y="7" width="16" height="8" rx="3"
                fill={alpha(glow, 0.25)} stroke={color} strokeWidth={1}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={active ? { scaleY: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{ transformOrigin: "60px 11px" }}
            />
            {/* Checklist items — 4 rows */}
            {[0, 1, 2, 3].map((i) => {
                const y = 38 + i * 18;
                const checked = i < 3;
                return (
                    <motion.g key={i}>
                        {/* Checkbox square */}
                        <motion.rect
                            x="36" y={y - 5} width="10" height="10" rx="2"
                            fill={checked ? alpha(glow, 0.15) : "none"}
                            stroke={checked ? color : alpha(color, 0.3)}
                            strokeWidth={1.2}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={active ? { scale: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.3, delay: 0.9 + i * 0.2 }}
                            style={{ transformOrigin: `41px ${y}px` }}
                        />
                        {/* Check mark */}
                        {checked && (
                            <motion.path
                                d={`M 38 ${y} L 40 ${y + 3} L 45 ${y - 3}`}
                                fill="none" stroke={color} strokeWidth={1.8}
                                strokeLinecap="round" strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={active ? { pathLength: 1, opacity: 1 } : {}}
                                transition={{ duration: 0.35, delay: 1.1 + i * 0.2 }}
                            />
                        )}
                        {/* Text line */}
                        <motion.line
                            x1="52" y1={y} x2={68 + (i % 2 === 0 ? 12 : 0)} y2={y}
                            stroke={alpha(color, checked ? 0.5 : 0.2)}
                            strokeWidth={2} strokeLinecap="round"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={active ? { scaleX: 1, opacity: 1 } : {}}
                            transition={{ duration: 0.4, delay: 1.0 + i * 0.2 }}
                            style={{ transformOrigin: `52px ${y}px` }}
                        />
                    </motion.g>
                );
            })}
            {/* Progress bar at bottom */}
            <motion.rect
                x="36" y="98" width="48" height="4" rx="2"
                fill={alpha(color, 0.1)} stroke="none"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 1.8 }}
            />
            <motion.rect
                x="36" y="98" width="36" height="4" rx="2"
                fill={alpha(color, 0.6)}
                filter="url(#pp-glow)"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={active ? { scaleX: 1, opacity: 1 } : {}}
                transition={{ duration: 1.0, delay: 2.0, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "36px 100px" }}
            />
        </svg>
    );
}

/** Production — film camera body with lens and recording indicator */
function ProductionGraphic({ color, glow, active }: { color: string; glow: string; active: boolean }) {
    return (
        <svg viewBox="0 0 120 120" width="160" height="160" style={{ overflow: "visible" }}>
            <defs>
                <filter id="prod-glow">
                    <feGaussianBlur stdDeviation="3.5" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="prod-soft">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>
            {/* Ambient glow */}
            <motion.ellipse
                cx="55" cy="62" rx="40" ry="28"
                fill={alpha(glow, 0.06)}
                filter="url(#prod-soft)"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.3, 0.5, 0.3] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Camera body */}
            <motion.rect
                x="18" y="38" width="68" height="48" rx="6"
                fill={alpha(glow, 0.05)} stroke={color} strokeWidth={1.8}
                filter="url(#prod-glow)"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={active ? { scaleX: 1, opacity: 1 } : {}}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "52px 62px" }}
            />
            {/* Viewfinder / top bump */}
            <motion.rect
                x="62" y="28" width="20" height="14" rx="3"
                fill={alpha(glow, 0.08)} stroke={color} strokeWidth={1.5}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={active ? { scaleY: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                style={{ transformOrigin: "72px 42px" }}
            />
            {/* Lens barrel */}
            <motion.circle
                cx="52" cy="62" r="18"
                fill="none" stroke={color} strokeWidth={2}
                filter="url(#prod-glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={active ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "52px 62px" }}
            />
            {/* Inner lens ring */}
            <motion.circle
                cx="52" cy="62" r="12"
                fill={alpha(glow, 0.08)} stroke={alpha(color, 0.6)} strokeWidth={1.2}
                initial={{ scale: 0 }}
                animate={active ? { scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.7 }}
                style={{ transformOrigin: "52px 62px" }}
            />
            {/* Lens glass reflection */}
            <motion.circle
                cx="52" cy="62" r="7"
                fill={alpha(glow, 0.12)}
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.2, 0.5, 0.2] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            {/* Lens glint */}
            <motion.ellipse
                cx="47" cy="57" rx="3" ry="5"
                fill={alpha(color, 0.2)}
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0, 0.6, 0] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
            />
            {/* REC indicator dot */}
            <motion.circle
                cx="28" cy="46" r="3.5"
                fill="#ef4444"
                filter="url(#prod-glow)"
                initial={{ opacity: 0, scale: 0 }}
                animate={active ? { opacity: [1, 0.2, 1], scale: 1 } : {}}
                transition={{ opacity: { duration: 1.2, repeat: Infinity }, scale: { duration: 0.4, delay: 1.2 } }}
                style={{ transformOrigin: "28px 46px" }}
            />
            {/* REC text */}
            <motion.text
                x="34" y="49" fontSize="7" fontWeight="700" fill="#ef4444" fontFamily="monospace"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [1, 0.2, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.05 }}
            >
                REC
            </motion.text>
            {/* Film reel accents on sides */}
            <motion.circle
                cx="100" cy="50" r="10"
                fill="none" stroke={alpha(color, 0.3)} strokeWidth={1}
                initial={{ rotate: 0 }}
                animate={active ? { rotate: 360 } : {}}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "100px 50px" }}
            />
            <motion.circle cx="100" cy="50" r="3" fill={alpha(color, 0.15)}
                initial={{ opacity: 0 }}
                animate={active ? { opacity: 1 } : {}}
                transition={{ delay: 1 }}
            />
            {/* Film reel spokes */}
            {[0, 90, 180, 270].map((deg, i) => (
                <motion.line
                    key={i}
                    x1="100" y1="50"
                    x2={100 + 10 * Math.cos((deg * Math.PI) / 180)}
                    y2={50 + 10 * Math.sin((deg * Math.PI) / 180)}
                    stroke={alpha(color, 0.2)} strokeWidth={0.8}
                    initial={{ opacity: 0 }}
                    animate={active ? { opacity: 1, rotate: 360 } : {}}
                    transition={{ opacity: { delay: 1 }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
                    style={{ transformOrigin: "100px 50px" }}
                />
            ))}
        </svg>
    );
}

/** Post-Production — computer monitor with waveform/timeline on screen */
function PostProdGraphic({ color, glow, active }: { color: string; glow: string; active: boolean }) {
    const bars = 10;
    return (
        <svg viewBox="0 0 120 120" width="120" height="120" style={{ overflow: "visible" }}>
            <defs>
                <filter id="post-glow">
                    <feGaussianBlur stdDeviation="3" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="post-soft">
                    <feGaussianBlur stdDeviation="8" />
                </filter>
                <clipPath id="screen-clip">
                    <rect x="22" y="20" width="76" height="52" rx="2" />
                </clipPath>
            </defs>
            {/* Screen glow behind monitor */}
            <motion.rect
                x="22" y="20" width="76" height="52" rx="4"
                fill={alpha(glow, 0.08)}
                filter="url(#post-soft)"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Monitor bezel */}
            <motion.rect
                x="16" y="14" width="88" height="64" rx="6"
                fill={alpha(glow, 0.04)} stroke={color} strokeWidth={2}
                filter="url(#post-glow)"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={active ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "60px 46px" }}
            />
            {/* Screen area */}
            <motion.rect
                x="22" y="20" width="76" height="52" rx="2"
                fill={alpha(glow, 0.06)}
                initial={{ opacity: 0 }}
                animate={active ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
            />
            {/* Stand neck */}
            <motion.rect
                x="52" y="78" width="16" height="12" rx="1"
                fill="none" stroke={alpha(color, 0.4)} strokeWidth={1.5}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={active ? { scaleY: 1, opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.6 }}
                style={{ transformOrigin: "60px 78px" }}
            />
            {/* Stand base */}
            <motion.ellipse
                cx="60" cy="94" rx="22" ry="4"
                fill="none" stroke={alpha(color, 0.4)} strokeWidth={1.5}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={active ? { scaleX: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.7 }}
                style={{ transformOrigin: "60px 94px" }}
            />
            {/* ON-SCREEN CONTENT: waveform + timeline (clipped to screen) */}
            <g clipPath="url(#screen-clip)">
                {/* Video preview area (top half of screen) */}
                <motion.rect
                    x="24" y="22" width="46" height="26" rx="1"
                    fill={alpha(color, 0.06)} stroke={alpha(color, 0.15)} strokeWidth={0.8}
                    initial={{ opacity: 0 }}
                    animate={active ? { opacity: 1 } : {}}
                    transition={{ delay: 0.9 }}
                />
                {/* Play triangle in preview */}
                <motion.polygon
                    points="42,30 42,42 52,36"
                    fill={alpha(color, 0.3)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={active ? { scale: 1, opacity: [0.3, 0.6, 0.3] } : {}}
                    transition={{ scale: { duration: 0.3, delay: 1.2 }, opacity: { duration: 2, repeat: Infinity, delay: 1.5 } }}
                    style={{ transformOrigin: "46px 36px" }}
                />
                {/* Inspector panel (right side) */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.line
                        key={`insp-${i}`}
                        x1="74" y1={26 + i * 6} x2="94" y2={26 + i * 6}
                        stroke={alpha(color, 0.2)} strokeWidth={1.5} strokeLinecap="round"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={active ? { scaleX: 1, opacity: 1 } : {}}
                        transition={{ duration: 0.3, delay: 1.0 + i * 0.1 }}
                        style={{ transformOrigin: `74px ${26 + i * 6}px` }}
                    />
                ))}
                {/* Timeline waveform bars (bottom of screen) */}
                {Array.from({ length: bars }, (_, i) => {
                    const baseH = 4 + Math.sin((i / bars) * Math.PI) * 10;
                    const x = 24 + i * 7.2;
                    return (
                        <motion.rect
                            key={i}
                            x={x} y={60 - baseH / 2}
                            width={4} height={baseH}
                            rx={2}
                            fill={alpha(color, 0.6)}
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={active ? {
                                scaleY: [1, 0.3 + Math.sin(i * 0.8) * 0.7, 1],
                                opacity: 1,
                            } : {}}
                            transition={{
                                scaleY: { duration: 1.8 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut" },
                                opacity: { duration: 0.3, delay: 1.1 + i * 0.06 },
                            }}
                            style={{ transformOrigin: `${x + 2}px 60px` }}
                        />
                    );
                })}
                {/* Playhead scanning across timeline */}
                <motion.line
                    x1="24" y1="52" x2="24" y2="68"
                    stroke={color} strokeWidth={1.5} strokeLinecap="round"
                    filter="url(#post-glow)"
                    initial={{ opacity: 0 }}
                    animate={active ? { opacity: 1, x1: [24, 94, 24], x2: [24, 94, 24] } : {}}
                    transition={{
                        opacity: { duration: 0.3, delay: 1.4 },
                        x1: { duration: 6, repeat: Infinity, ease: "linear", delay: 1.8 },
                        x2: { duration: 6, repeat: Infinity, ease: "linear", delay: 1.8 },
                    }}
                />
            </g>
            {/* Power LED */}
            <motion.circle
                cx="60" cy="74" r="1.5"
                fill={color}
                filter="url(#post-glow)"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.6, 1, 0.6] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
            />
        </svg>
    );
}

/** Delivery — cloud upload with file rising into cloud */
function DeliveryGraphic({ color, glow, active }: { color: string; glow: string; active: boolean }) {
    return (
        <svg viewBox="0 0 120 120" width="160" height="160" style={{ overflow: "visible" }}>
            <defs>
                <filter id="del-glow">
                    <feGaussianBlur stdDeviation="3.5" />
                    <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="del-soft">
                    <feGaussianBlur stdDeviation="8" />
                </filter>
            </defs>
            {/* Ambient cloud glow */}
            <motion.ellipse
                cx="60" cy="48" rx="42" ry="24"
                fill={alpha(glow, 0.06)}
                filter="url(#del-soft)"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.3, 0.5, 0.3] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Cloud shape — compound of circles + rect */}
            <motion.path
                d="M 30 58 C 30 58, 18 58, 18 46 C 18 36, 28 30, 38 32 C 40 22, 52 16, 64 18 C 76 20, 84 30, 84 38 C 96 38, 104 46, 100 56 C 98 62, 90 64, 84 62 L 36 62 C 32 62, 30 60, 30 58 Z"
                fill={alpha(glow, 0.06)} stroke={color} strokeWidth={1.8}
                filter="url(#del-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={active ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Cloud inner glow */}
            <motion.path
                d="M 36 56 C 36 56, 26 56, 26 46 C 26 40, 32 36, 40 38 C 42 30, 52 24, 62 26 C 72 28, 78 34, 78 40 C 88 40, 94 46, 92 52 C 90 56, 86 58, 80 56 Z"
                fill={alpha(glow, 0.04)} stroke="none"
                initial={{ opacity: 0 }}
                animate={active ? { opacity: [0.3, 0.6, 0.3] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            {/* Upload arrow */}
            <motion.line
                x1="60" y1="100" x2="60" y2="68"
                stroke={color} strokeWidth={2.5} strokeLinecap="round"
                filter="url(#del-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={active ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 1.2 }}
            />
            {/* Arrow head */}
            <motion.path
                d="M 50 78 L 60 66 L 70 78"
                fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                filter="url(#del-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={active ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.5 }}
            />
            {/* Rising file documents */}
            {[
                { x: 46, delay: 2.0 },
                { x: 60, delay: 2.6 },
                { x: 74, delay: 3.2 },
            ].map((f, i) => (
                <motion.g key={i}>
                    {/* File rect */}
                    <motion.rect
                        x={f.x - 6} y={102} width={12} height={15} rx={2}
                        fill={alpha(glow, 0.12)} stroke={alpha(color, 0.5)} strokeWidth={1}
                        initial={{ opacity: 0, y: 0 }}
                        animate={active ? {
                            opacity: [0, 0.9, 0.9, 0],
                            y: [0, -20, -45, -65],
                        } : {}}
                        transition={{ duration: 3, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
                    />
                    {/* File folded corner */}
                    <motion.path
                        d={`M ${f.x + 2} ${102} L ${f.x + 6} ${102} L ${f.x + 6} ${106} Z`}
                        fill={alpha(color, 0.2)} stroke="none"
                        initial={{ opacity: 0, y: 0 }}
                        animate={active ? {
                            opacity: [0, 0.7, 0.7, 0],
                            y: [0, -20, -45, -65],
                        } : {}}
                        transition={{ duration: 3, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
                    />
                    {/* File lines */}
                    {[0, 1].map((li) => (
                        <motion.line
                            key={li}
                            x1={f.x - 3} y1={109 + li * 4} x2={f.x + 3} y2={109 + li * 4}
                            stroke={alpha(color, 0.3)} strokeWidth={1} strokeLinecap="round"
                            initial={{ opacity: 0, y: 0 }}
                            animate={active ? {
                                opacity: [0, 0.6, 0.6, 0],
                                y: [0, -20, -45, -65],
                            } : {}}
                            transition={{ duration: 3, repeat: Infinity, delay: f.delay, ease: "easeInOut" }}
                        />
                    ))}
                </motion.g>
            ))}
            {/* Completion sparkles around cloud */}
            {[
                { x: 20, y: 36, delay: 2.0 },
                { x: 100, y: 40, delay: 2.5 },
                { x: 60, y: 14, delay: 3.0 },
                { x: 38, y: 22, delay: 3.5 },
                { x: 86, y: 26, delay: 4.0 },
            ].map((s, i) => (
                <motion.g key={`sp-${i}`}>
                    <motion.line
                        x1={s.x - 4} y1={s.y} x2={s.x + 4} y2={s.y}
                        stroke={alpha(color, 0.5)} strokeWidth={1} strokeLinecap="round"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={active ? { scale: [0, 1, 0], opacity: [0, 0.8, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: s.delay }}
                        style={{ transformOrigin: `${s.x}px ${s.y}px` }}
                    />
                    <motion.line
                        x1={s.x} y1={s.y - 4} x2={s.x} y2={s.y + 4}
                        stroke={alpha(color, 0.5)} strokeWidth={1} strokeLinecap="round"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={active ? { scale: [0, 1, 0], opacity: [0, 0.8, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: s.delay }}
                        style={{ transformOrigin: `${s.x}px ${s.y}px` }}
                    />
                </motion.g>
            ))}
        </svg>
    );
}

/** Map of phase key → graphic component */
const PHASE_GRAPHIC: Record<string, React.FC<{ color: string; glow: string; active: boolean }>> = {
    Creative_Development: CreativeGraphic,
    Pre_Production: PreProdGraphic,
    Production: ProductionGraphic,
    Post_Production: PostProdGraphic,
    Delivery: DeliveryGraphic,
};

/* ── Framer Motion variants ─────────────────────────────────────── */
const titleVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants: Variants = {
    hidden: (side: "left" | "right") => ({
        opacity: 0,
        x: side === "left" ? -60 : 60,
        y: 30,
    }),
    visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
};

/* ── Phase card ─────────────────────────────────────────────────── */
function PhaseCard({ meta, colors, side, index, phaseKey, onMeasure }: {
    meta: typeof PHASE_META[string];
    colors: SectionBaseProps["colors"];
    side: "left" | "right";
    index: number;
    phaseKey: string;
    onMeasure: (index: number, el: HTMLDivElement | null) => void;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef as React.RefObject<HTMLElement>, { once: true, amount: 0.15 });
    const Graphic = PHASE_GRAPHIC[phaseKey];

    useEffect(() => {
        onMeasure(index, cardRef.current);
    }, [index, onMeasure]);

    return (
        <Box
            ref={cardRef}
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
            }}
        >
            <motion.div
                custom={side}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                style={{ width: "100%", maxWidth: 520 }}
            >
                <Box sx={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                }}>
                    {/* Animated phase graphic — sits on the line */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                        style={{ flexShrink: 0, zIndex: 2 }}
                    >
                        <Box sx={{
                            width: 160, height: 160,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            filter: `drop-shadow(0 0 30px ${alpha(meta.glowColor, 0.5)})`,
                        }}>
                            {Graphic && <Graphic color={meta.color} glow={meta.glowColor} active={isInView} />}
                        </Box>
                    </motion.div>

                    {/* Title glass card — directly below icon, on the line */}
                    <Box sx={{
                        mt: -1,
                        width: "100%",
                        bgcolor: alpha(colors.card, 0.65),
                        backdropFilter: "blur(24px) saturate(1.4)",
                        border: `1px solid ${alpha(meta.color, 0.18)}`,
                        borderRadius: 3, px: 3.5, py: 2.5,
                        position: "relative", overflow: "hidden",
                        zIndex: 2,
                        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
                        textAlign: "center",
                        "&:hover": {
                            borderColor: alpha(meta.color, 0.4),
                            boxShadow: `0 0 50px ${alpha(meta.glowColor, 0.1)}`,
                        },
                    }}>
                        {/* Watermark number */}
                        <Typography sx={{
                            position: "absolute", top: -10, right: 14,
                            fontSize: "5rem", fontWeight: 900, lineHeight: 1,
                            color: alpha(meta.color, 0.04),
                            userSelect: "none", pointerEvents: "none",
                        }}>
                            {String(index + 1).padStart(2, "0")}
                        </Typography>

                        <Typography sx={{
                            fontSize: "1.05rem", fontWeight: 700,
                            color: meta.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                        }}>
                            {meta.label}
                        </Typography>

                        <Typography sx={{
                            fontSize: "0.72rem", fontWeight: 300,
                            color: alpha(colors.text, 0.45),
                            lineHeight: 1.8,
                            mt: 0.5,
                        }}>
                            {meta.description}
                        </Typography>
                    </Box>
                </Box>
            </motion.div>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Scroll-driven SVG river                                            */
/* ═══════════════════════════════════════════════════════════════════ */

/* ── Cubic bezier point helper ──────────────────────────────────── */
function cubicBezier(
    t: number,
    p0: { x: number; y: number },
    cp1: { x: number; y: number },
    cp2: { x: number; y: number },
    p1: { x: number; y: number },
): { x: number; y: number } {
    const u = 1 - t;
    return {
        x: u * u * u * p0.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * p1.x,
        y: u * u * u * p0.y + 3 * u * u * t * cp1.y + 3 * u * t * t * cp2.y + t * t * t * p1.y,
    };
}

function RiverOverlay({ containerRef, cardRefs, phaseMetas, phaseTaskDetails, scrollProgress }: {
    containerRef: React.RefObject<HTMLDivElement>;
    cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    phaseMetas: { color: string; glowColor: string; side: "left" | "right" }[];
    phaseTaskDetails: (PublicProposalTaskDetail & { name: string })[][];
    scrollProgress: MotionValue<number>;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [pathD, setPathD] = useState("");
    const [totalH, setTotalH] = useState(0);
    const [svgW, setSvgW] = useState(760);
    const [gradientStops, setGradientStops] = useState<{ offset: string; color: string }[]>([]);
    const [nodePositions, setNodePositions] = useState<{ x: number; y: number }[]>([]);
    const [cardMasks, setCardMasks] = useState<{ x: number; y: number; w: number; h: number }[]>([]);
    const [taskNodes, setTaskNodes] = useState<{ x: number; y: number; label: string; description: string | null; deliverable: string | null; requiresAction: boolean; color: string; glowColor: string; segmentIdx: number }[]>([]);

    // Smooth spring-driven path progress tied to scroll
    const smoothProgress = useSpring(scrollProgress, { stiffness: 50, damping: 20 });
    const pathLength = useTransform(smoothProgress, [0, 1], [0.02, 1]);
    const glowOpacity = useTransform(smoothProgress, [0, 0.1], [0, 0.35]);
    const coreOpacity = useTransform(smoothProgress, [0, 0.1], [0, 0.8]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const measure = () => {
            const cards = cardRefs.current;
            const cRect = container.getBoundingClientRect();
            const h = container.scrollHeight;
            const w = container.offsetWidth;
            setTotalH(h);
            setSvgW(w);

            const points: { x: number; y: number }[] = [];
            const cardBoxes: { x: number; y: number; w: number; h: number }[] = [];
            cards.forEach((card) => {
                if (!card) return;
                const cardRect = card.getBoundingClientRect();
                // All cards are centered — river goes through the center of each card
                const cx = (cardRect.left - cRect.left) + cardRect.width / 2;
                const cy = (cardRect.top - cRect.top) + cardRect.height / 2;
                points.push({ x: cx, y: cy });
                // Store card bounding box for masking
                cardBoxes.push({
                    x: (cardRect.left - cRect.left),
                    y: (cardRect.top - cRect.top),
                    w: cardRect.width,
                    h: cardRect.height,
                });
            });

            if (points.length < 2) return;
            setNodePositions(points);
            setCardMasks(cardBoxes);

            // Build a beautiful flowing S-curve river
            const segments: string[] = [];
            const startY = Math.max(0, points[0].y - 180);
            segments.push(`M ${points[0].x} ${startY}`);
            segments.push(`L ${points[0].x} ${points[0].y}`);

            // Store bezier segment data for task placement
            const bezierSegments: { from: { x: number; y: number }; cp1: { x: number; y: number }; cp2: { x: number; y: number }; to: { x: number; y: number } }[] = [];

            // Lateral sway amplitude — how far the river swings left/right between phases
            const sway = w * 0.18;

            for (let i = 0; i < points.length - 1; i++) {
                const from = points[i];
                const to = points[i + 1];
                const dy = to.y - from.y;
                // Alternate sway direction for an S-curve pattern
                const swayDir = i % 2 === 0 ? 1 : -1;
                const midX = (from.x + to.x) / 2 + sway * swayDir;
                const cp1: { x: number; y: number } = { x: midX, y: from.y + dy * 0.35 };
                const cp2: { x: number; y: number } = { x: midX, y: to.y - dy * 0.35 };
                segments.push(`C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`);
                bezierSegments.push({ from, cp1, cp2, to });
            }

            const last = points[points.length - 1];
            const endY = Math.min(h, last.y + 180);
            segments.push(`L ${last.x} ${endY}`);

            setPathD(segments.join(" "));

            // Compute task node positions along bezier segments
            const allTaskNodes: typeof taskNodes = [];
            for (let segIdx = 0; segIdx < bezierSegments.length; segIdx++) {
                const seg = bezierSegments[segIdx];
                const details = phaseTaskDetails[segIdx] ?? [];
                if (details.length === 0) continue;
                // Distribute tasks along the curve, capping step size so few tasks don't spread too far
                const count = details.length;
                const maxStepT = 0.20; // max t-distance between consecutive tasks
                const fullRange = 0.7; // t=0.15 to t=0.85
                const neededRange = Math.min(fullRange, (count - 1) * maxStepT);
                const startT = 0.5 - neededRange / 2; // center the cluster
                for (let ti = 0; ti < count; ti++) {
                    const t = count === 1 ? 0.5 : startT + (ti / (count - 1)) * neededRange;
                    const adjustedT = t;
                    const pos = cubicBezier(adjustedT, seg.from, seg.cp1, seg.cp2, seg.to);
                    const td = details[ti];
                    allTaskNodes.push({
                        x: pos.x,
                        y: pos.y,
                        label: td.name,
                        description: td.description ?? null,
                        deliverable: td.deliverable ?? null,
                        requiresAction: td.requiresAction ?? false,
                        color: phaseMetas[segIdx].color,
                        glowColor: phaseMetas[segIdx].glowColor,
                        segmentIdx: segIdx,
                    });
                }
            }
            setTaskNodes(allTaskNodes);

            const stops = points.map((p, i) => ({
                offset: `${Math.round((p.y / h) * 100)}%`,
                color: phaseMetas[i].color,
            }));
            setGradientStops(stops);
        };

        const raf = requestAnimationFrame(measure);
        window.addEventListener("resize", measure);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", measure);
        };
    }, [containerRef, cardRefs, phaseMetas, phaseTaskDetails]);

    if (!pathD || totalH === 0) return null;

    return (
        <Box sx={{
            position: "absolute", top: 0, left: 0, width: "100%", height: totalH,
            pointerEvents: "none", zIndex: 0,
            display: { xs: "none", sm: "block" },
        }}>
            {/* CSS animation for the flowing dash effect */}
            <style>{`
                @keyframes river-flow {
                    to { stroke-dashoffset: -40; }
                }
                @keyframes river-flow-reverse {
                    to { stroke-dashoffset: 40; }
                }
                @keyframes orb-travel {
                    0% { offset-distance: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { offset-distance: 100%; opacity: 0; }
                }
            `}</style>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${svgW} ${totalH}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
                <defs>
                    <linearGradient id="river-grad" x1="0" y1="0" x2="0" y2="1">
                        {gradientStops.map((s, i) => (
                            <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.7} />
                        ))}
                    </linearGradient>
                    <linearGradient id="river-bg-grad" x1="0" y1="0" x2="0" y2="1">
                        {gradientStops.map((s, i) => (
                            <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.05} />
                        ))}
                    </linearGradient>
                    <linearGradient id="river-accent-grad" x1="0" y1="0" x2="0" y2="1">
                        {gradientStops.map((s, i) => (
                            <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.3} />
                        ))}
                    </linearGradient>
                    <filter id="river-glow-strong">
                        <feGaussianBlur stdDeviation="6" result="blur1" />
                        <feGaussianBlur stdDeviation="2" result="blur2" />
                        <feMerge>
                            <feMergeNode in="blur1" />
                            <feMergeNode in="blur2" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="river-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="16" />
                    </filter>
                    <filter id="river-ultra-soft" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="28" />
                    </filter>
                    <filter id="task-glow">
                        <feGaussianBlur stdDeviation="2.5" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="orb-glow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Mask that hides the river line behind phase cards */}
                    <mask id="river-card-mask">
                        <rect x={-svgW} y={-totalH} width={svgW * 3} height={totalH * 3} fill="white" />
                        {cardMasks.map((cm, i) => (
                            <rect
                                key={i}
                                x={cm.x - 16}
                                y={cm.y - 16}
                                width={cm.w + 32}
                                height={cm.h + 32}
                                rx={20}
                                fill="black"
                            />
                        ))}
                    </mask>
                </defs>

                {/* All river layers inside a masked group */}
                <g mask="url(#river-card-mask)">
                    {/* Layer 1: Ultra-wide ambient glow (always visible) */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="url(#river-bg-grad)"
                        strokeWidth={40}
                        strokeLinecap="round"
                        filter="url(#river-ultra-soft)"
                    />

                    {/* Layer 2: Wide soft glow — scroll-driven */}
                    <motion.path
                        d={pathD}
                        fill="none"
                        stroke="url(#river-grad)"
                        strokeWidth={16}
                        strokeLinecap="round"
                        filter="url(#river-soft-glow)"
                        style={{ pathLength, opacity: glowOpacity }}
                    />

                    {/* Layer 3: Mid glow band — scroll-driven */}
                    <motion.path
                        d={pathD}
                        fill="none"
                        stroke="url(#river-grad)"
                        strokeWidth={6}
                        strokeLinecap="round"
                        filter="url(#river-glow-strong)"
                        style={{ pathLength, opacity: glowOpacity }}
                    />

                    {/* Layer 4: Core bright line — scroll-driven */}
                    <motion.path
                        d={pathD}
                        fill="none"
                        stroke="url(#river-grad)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        style={{ pathLength, opacity: coreOpacity }}
                    />

                    {/* Layer 5: Flowing animated dash overlay — creates "liquid flow" effect */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="url(#river-accent-grad)"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeDasharray="8 32"
                        style={{ animation: "river-flow 1.8s linear infinite" }}
                    />
                    {/* Second dash layer, offset for depth */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="url(#river-accent-grad)"
                        strokeWidth={1}
                        strokeLinecap="round"
                        strokeDasharray="4 48"
                        strokeDashoffset={20}
                        style={{ animation: "river-flow 2.5s linear infinite" }}
                    />
                </g>

                {/* Traveling orbs along the path */}
                {pathD && (
                    <>
                        {[0, 0.25, 0.5, 0.75].map((delay, i) => (
                            <circle
                                key={`orb-${i}`}
                                r={3}
                                fill="white"
                                opacity={0.6}
                                filter="url(#orb-glow)"
                                style={{
                                    offsetPath: `path('${pathD}')`,
                                    animation: `orb-travel ${6 + i * 0.5}s linear ${delay * 6}s infinite`,
                                } as React.CSSProperties}
                            />
                        ))}
                    </>
                )}

                {/* Task nodes along the river between phases (outside mask so always visible) */}
                {taskNodes.map((tn, i) => {
                    const midX = svgW / 2;
                    const naturalSide: "left" | "right" = tn.x < midX ? "right" : "left";
                    // Tasks that require client action appear on the opposite side
                    const labelSide = tn.requiresAction ? (naturalSide === "left" ? "right" : "left") : naturalSide;
                    return (
                        <TaskNode
                            key={`task-${i}`}
                            cx={tn.x}
                            cy={tn.y}
                            label={tn.label}
                            description={tn.description}
                            deliverable={tn.deliverable}
                            requiresAction={tn.requiresAction}
                            color={tn.color}
                            glow={tn.glowColor}
                            labelSide={labelSide}
                            index={i}
                        />
                    );
                })}

                {/* Phase node glowing dots on the river */}
                {nodePositions.map((pos, i) => (
                    <PhaseNodeDot
                        key={i}
                        cx={pos.x}
                        cy={pos.y}
                        color={phaseMetas[i].color}
                        glow={phaseMetas[i].glowColor}
                    />
                ))}
            </svg>
        </Box>
    );
}

/** Task node: dot on the river line with label + description to the side */
function TaskNode({ cx, cy, label, description, deliverable, requiresAction, color, glow, labelSide, index }: {
    cx: number; cy: number; label: string; description: string | null; deliverable: string | null;
    requiresAction: boolean; color: string; glow: string;
    labelSide: "left" | "right"; index: number;
}) {
    const labelX = labelSide === "right" ? cx + 32 : cx - 32;
    const textAnchor = labelSide === "right" ? "start" : "end";
    const maxTextWidth = 260;

    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
            {/* Outer glow ring */}
            <circle
                cx={cx} cy={cy} r={10}
                fill="none" stroke={alpha(glow, 0.15)} strokeWidth={1}
            />
            {/* Colored dot */}
            <circle
                cx={cx} cy={cy} r={5}
                fill={alpha(color, 0.9)}
                stroke={alpha(glow, 0.5)}
                strokeWidth={1.5}
                filter="url(#task-glow)"
            />
            {/* Bright centre */}
            <circle
                cx={cx} cy={cy} r={2}
                fill="#fff"
                opacity={0.8}
            />
            {/* Connector line from dot to label */}
            <line
                x1={labelSide === "right" ? cx + 10 : cx - 10}
                y1={cy}
                x2={labelSide === "right" ? cx + 30 : cx - 30}
                y2={cy}
                stroke={alpha(color, 0.25)}
                strokeWidth={1}
                strokeLinecap="round"
                strokeDasharray="2 3"
            />
            {/* Task label */}
            <text
                x={labelX}
                y={cy - (description ? 6 : 0)}
                fontSize={13.5}
                fontWeight={700}
                fill="rgba(255,255,255,0.92)"
                fontFamily="'Inter', system-ui, sans-serif"
                textAnchor={textAnchor}
            >
                {label}
            </text>
            {/* Description text — wrapped */}
            {description && (
                <foreignObject
                    x={labelSide === "right" ? labelX : labelX - maxTextWidth}
                    y={cy + 4}
                    width={maxTextWidth}
                    height={100}
                >
                    <div
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                        style={{
                            fontSize: 11.5,
                            fontWeight: 300,
                            color: "rgba(255,255,255,0.55)",
                            lineHeight: 1.55,
                            fontFamily: "'Inter', system-ui, sans-serif",
                            textAlign: labelSide === "right" ? "left" : "right",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {description}
                    </div>
                    {deliverable && (
                        <div
                            style={{
                                fontSize: 10.5,
                                fontWeight: 400,
                                color: alpha(color, 0.6),
                                lineHeight: 1.45,
                                fontFamily: "'Inter', system-ui, sans-serif",
                                fontStyle: "italic",
                                textAlign: labelSide === "right" ? "left" : "right",
                                marginTop: 3,
                            }}
                        >
                            You&apos;ll receive: {deliverable}
                        </div>
                    )}
                </foreignObject>
            )}
            {/* Deliverable only (no description) */}
            {!description && deliverable && (
                <text
                    x={labelX}
                    y={cy + 16}
                    fontSize={10.5}
                    fontWeight={400}
                    fill={alpha(color, 0.6)}
                    fontFamily="'Inter', system-ui, sans-serif"
                    textAnchor={textAnchor}
                    fontStyle="italic"
                >
                    You&apos;ll receive: {deliverable}
                </text>
            )}
        </motion.g>
    );
}

/** Glowing phase dot on the river at each phase anchor */
function PhaseNodeDot({ cx, cy, color, glow }: {
    cx: number; cy: number; color: string; glow: string;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
            {/* Animated pulse ring */}
            <circle
                cx={cx} cy={cy} r={10}
                fill="none" stroke={alpha(glow, 0.2)} strokeWidth={1.5}
            >
                <animate attributeName="r" values="8;14;8" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Core dot */}
            <circle
                cx={cx} cy={cy} r={5}
                fill={color}
                filter="url(#river-glow-strong)"
            />
            {/* Bright centre */}
            <circle cx={cx} cy={cy} r={2} fill="#fff" opacity={0.7} />
        </motion.g>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* Main component                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export default function ProjectPhasesSection({ phases, colors }: ProjectPhasesSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [measured, setMeasured] = useState(false);

    // Scroll progress — starts as soon as section enters the bottom of viewport
    const { scrollYProgress } = useScroll({
        target: containerRef as React.RefObject<HTMLElement>,
        offset: ["start 95%", "end 20%"],
    });

    const displayPhases = useMemo(() =>
        (phases ?? [])
            .filter((p) => !EXCLUDED_PHASES.has(p.phase) && PHASE_META[p.phase])
            .sort((a, b) => PHASE_META[a.phase].order - PHASE_META[b.phase].order),
        [phases],
    );

    const phaseMetas = useMemo(() =>
        displayPhases.map((p, i) => ({
            color: PHASE_META[p.phase].color,
            glowColor: PHASE_META[p.phase].glowColor,
            side: (i % 2 === 0 ? "left" : "right") as "left" | "right",
        })),
        [displayPhases],
    );

    const handleMeasure = useCallback((index: number, el: HTMLDivElement | null) => {
        cardRefs.current[index] = el;
        if (el && cardRefs.current.filter(Boolean).length === displayPhases.length) {
            setMeasured(true);
        }
    }, [displayPhases.length]);

    if (displayPhases.length === 0) return null;

    const CARD_GAP = { xs: 60, sm: 135 };

    return (
        <Box ref={containerRef} sx={{ position: "relative", pt: { xs: 16, sm: 24 }, pb: 10 }}>
            {/* Scroll-driven river with task nodes */}
            {measured && (
                <RiverOverlay
                    containerRef={containerRef}
                    cardRefs={cardRefs}
                    phaseMetas={phaseMetas}
                    phaseTaskDetails={displayPhases.map(p => (p.taskDetails ?? (p.tasks ?? []).map(t => ({ name: t, description: null, requiresAction: false, deliverable: null }))))}
                    scrollProgress={scrollYProgress}
                />
            )}

            <motion.div
                variants={titleVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                <Typography sx={{
                    color: "#fff", textTransform: "uppercase", letterSpacing: 6,
                    fontSize: { xs: "1.4rem", sm: "1.8rem" }, fontWeight: 700, textAlign: "center",
                    mb: { xs: 14, sm: 20 },
                }}>
                    Your Project Journey
                </Typography>
            </motion.div>

            <Box sx={{
                display: "flex", flexDirection: "column",
                gap: CARD_GAP,
                position: "relative", zIndex: 1,
            }}>
                {displayPhases.map((phase, idx) => {
                    const meta = PHASE_META[phase.phase];
                    const side: "left" | "right" = idx % 2 === 0 ? "left" : "right";
                    return (
                        <PhaseCard
                            key={phase.phase}
                            meta={meta}
                            colors={colors}
                            side={side}
                            index={idx}
                            phaseKey={phase.phase}
                            onMeasure={handleMeasure}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}
