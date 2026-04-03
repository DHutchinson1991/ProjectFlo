"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { JourneyStep } from '@/features/workflow/proposals/types/portal';

const STEP_PLAYTHROUGH_MS = 2500;
const LOCAL_STORAGE_PREFIX = 'portal-visited-';

interface JourneyAnimationState {
    /** The step currently displayed in the central animation area */
    displayedStep: JourneyStep | null;
    /** Whether we're playing through completed steps */
    isPlayingThrough: boolean;
    /** Index in the steps array currently shown during playthrough */
    playthroughIndex: number;
    /** Whether the playthrough is complete and we're on the resting step */
    isResting: boolean;
    /** Which step icon is entering (for crossfade) */
    enteringStep: JourneyStep | null;
    /** Which step icon is exiting (for crossfade) */
    exitingStep: JourneyStep | null;
}

export function useJourneyAnimation(steps: JourneyStep[], portalToken: string) {
    const storageKey = `${LOCAL_STORAGE_PREFIX}${portalToken}`;
    const isFirstVisit = useRef<boolean | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [state, setState] = useState<JourneyAnimationState>({
        displayedStep: null,
        isPlayingThrough: false,
        playthroughIndex: -1,
        isResting: false,
        enteringStep: null,
        exitingStep: null,
    });

    // Stable fingerprint of all step statuses — changes when backend data changes
    const stepsFingerprint = useMemo(
        () => steps.map((s) => `${s.key}:${s.status}`).join('|'),
        [steps],
    );
    const prevFingerprintRef = useRef<string>('');

    // Find the current/active step (first non-completed, or last completed)
    const currentStepIndex = steps.findIndex(
        (s) => s.status === 'active' || s.status === 'waiting',
    );
    const restingStep = currentStepIndex >= 0
        ? steps[currentStepIndex]
        : steps[steps.length - 1] ?? null;

    const completedSteps = steps.filter((s) => s.status === 'completed');

    // Detect first visit
    useEffect(() => {
        if (isFirstVisit.current !== null) return;
        try {
            const visited = localStorage.getItem(storageKey);
            isFirstVisit.current = !visited;
            if (!visited) {
                localStorage.setItem(storageKey, new Date().toISOString());
            }
        } catch {
            isFirstVisit.current = false;
        }
    }, [storageKey]);

    // Start playthrough or go straight to resting
    useEffect(() => {
        if (steps.length === 0 || isFirstVisit.current === null) return;
        if (state.displayedStep || state.isPlayingThrough) return;

        if (isFirstVisit.current && completedSteps.length > 0) {
            setState((prev) => ({
                ...prev,
                isPlayingThrough: true,
                playthroughIndex: 0,
                displayedStep: completedSteps[0],
                enteringStep: completedSteps[0],
            }));
        } else {
            setState((prev) => ({
                ...prev,
                displayedStep: restingStep,
                isResting: true,
                enteringStep: restingStep,
            }));
        }
        // Record initial fingerprint
        prevFingerprintRef.current = stepsFingerprint;
    }, [steps.length, completedSteps.length, restingStep, state.displayedStep, state.isPlayingThrough, stepsFingerprint]);

    // ── Live-update: react to ANY step status change from polling ──
    useEffect(() => {
        // Don't interrupt playthroughs or initial setup
        if (!state.isResting || state.isPlayingThrough) {
            // Still record fingerprint so we have a baseline when resting starts
            if (stepsFingerprint && !prevFingerprintRef.current) {
                prevFingerprintRef.current = stepsFingerprint;
            }
            return;
        }

        // Nothing to compare yet
        if (!prevFingerprintRef.current) {
            prevFingerprintRef.current = stepsFingerprint;
            return;
        }

        // No change
        if (prevFingerprintRef.current === stepsFingerprint) return;

        // Steps changed! Update baseline and transition
        prevFingerprintRef.current = stepsFingerprint;

        if (restingStep) {
            setState((prev) => ({
                ...prev,
                exitingStep: prev.displayedStep,
                enteringStep: restingStep,
                displayedStep: restingStep,
            }));
        }
    }, [stepsFingerprint, state.isResting, state.isPlayingThrough, restingStep]);

    // Advance playthrough
    useEffect(() => {
        if (!state.isPlayingThrough) return;

        timerRef.current = setTimeout(() => {
            const nextIndex = state.playthroughIndex + 1;

            if (nextIndex < completedSteps.length) {
                const nextStep = completedSteps[nextIndex];
                setState((prev) => ({
                    ...prev,
                    playthroughIndex: nextIndex,
                    exitingStep: prev.displayedStep,
                    enteringStep: nextStep,
                    displayedStep: nextStep,
                }));
            } else {
                // Playthrough done — land on current step
                setState((prev) => ({
                    ...prev,
                    isPlayingThrough: false,
                    exitingStep: prev.displayedStep,
                    enteringStep: restingStep,
                    displayedStep: restingStep,
                    isResting: true,
                }));
            }
        }, STEP_PLAYTHROUGH_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [state.isPlayingThrough, state.playthroughIndex, completedSteps, restingStep]);

    // Clear entering/exiting after transition
    useEffect(() => {
        if (!state.enteringStep) return;
        const timer = setTimeout(() => {
            setState((prev) => ({ ...prev, enteringStep: null, exitingStep: null }));
        }, 900);
        return () => clearTimeout(timer);
    }, [state.enteringStep]);

    const skipPlaythrough = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setState((prev) => ({
            ...prev,
            isPlayingThrough: false,
            exitingStep: prev.displayedStep,
            enteringStep: restingStep,
            displayedStep: restingStep,
            isResting: true,
        }));
    }, [restingStep]);

    return {
        displayedStep: state.displayedStep,
        isPlayingThrough: state.isPlayingThrough,
        isResting: state.isResting,
        enteringStep: state.enteringStep,
        exitingStep: state.exitingStep,
        currentStepIndex,
        completedCount: completedSteps.length,
        totalCount: steps.length,
        skipPlaythrough,
    };
}
