"use client";

/**
 * Portal & Proposal shared animations.
 *
 * All keyframe definitions and the scroll-reveal hook used by
 * both the portal dashboard and proposal viewer pages.
 */

import { useEffect, useRef, useState } from "react";
import { keyframes } from "@mui/material/styles";

/* ------------------------------------------------------------------ */
/* Keyframe animations                                                 */
/* ------------------------------------------------------------------ */

export const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
`;

export const fadeIn = keyframes`
    from { opacity: 0; }
    to   { opacity: 1; }
`;

export const scaleIn = keyframes`
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
`;

export const shimmer = keyframes`
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

export const float = keyframes`
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-14px) rotate(1deg); }
`;

export const pulseGlow = keyframes`
    0%, 100% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.3); }
    50%      { box-shadow: 0 0 24px 4px rgba(124, 77, 255, 0.15); }
`;

export const gradientShift = keyframes`
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

export const subtleFloat = keyframes`
    0%, 100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-8px) scale(1.02); }
`;

/* ------------------------------------------------------------------ */
/* Scroll-reveal hook                                                  */
/* ------------------------------------------------------------------ */

export function useReveal(opts?: { threshold?: number; rootMargin?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: opts?.threshold ?? 0.15, rootMargin: opts?.rootMargin ?? "0px 0px -40px 0px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [opts?.threshold, opts?.rootMargin]);

    return { ref, visible };
}

/** Shorthand sx for reveal animation. */
export function revealSx(visible: boolean, delay = 0) {
    return {
        opacity: visible ? 1 : 0,
        animation: visible ? `${fadeInUp} 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` : "none",
    };
}
