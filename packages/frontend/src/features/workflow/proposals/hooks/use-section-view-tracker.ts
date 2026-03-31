'use client';

import { useCallback, useRef } from 'react';
import { publicProposalsApi } from '../api';

/**
 * Tracks which proposal sections the client has scrolled into view,
 * and how long they spend on each section.
 *
 * Returns `{ onSectionView, onSectionDuration }`:
 * - `onSectionView` fires once per section per page load.
 * - `onSectionDuration` is called periodically by SectionTracker with accumulated seconds.
 */
export function useSectionViewTracker(token: string) {
  const reported = useRef(new Set<string>());

  const onSectionView = useCallback(
    (sectionType: string) => {
      if (!token || reported.current.has(sectionType)) return;
      reported.current.add(sectionType);
      // Fire-and-forget — don't block rendering
      publicProposalsApi.trackSectionView(token, sectionType).catch(() => {});
    },
    [token],
  );

  const onSectionDuration = useCallback(
    (sectionType: string, seconds: number) => {
      if (!token || seconds <= 0) return;
      publicProposalsApi.trackSectionView(token, sectionType, seconds).catch(() => {});
    },
    [token],
  );

  return { onSectionView, onSectionDuration };
}
