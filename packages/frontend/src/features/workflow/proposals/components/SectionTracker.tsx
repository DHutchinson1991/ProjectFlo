'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface SectionTrackerProps {
  sectionType: string;
  onView: (sectionType: string) => void;
  /** Called periodically with accumulated seconds while visible */
  onDuration?: (sectionType: string, seconds: number) => void;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * A thin wrapper that fires `onView(sectionType)` once the section is
 * 15 % visible in the viewport (one-shot), and continuously tracks
 * how long the section stays visible via `onDuration`.
 */
export default function SectionTracker({ sectionType, onView, onDuration, children, sx }: SectionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewFired = useRef(false);
  const visibleSince = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  // Flush accumulated time
  const flush = useCallback(() => {
    if (visibleSince.current !== null) {
      const elapsed = (Date.now() - visibleSince.current) / 1000;
      accumulatedRef.current += elapsed;
      visibleSince.current = Date.now(); // reset for next interval
    }
    if (accumulatedRef.current > 0 && onDuration) {
      const seconds = Math.round(accumulatedRef.current);
      if (seconds > 0) {
        onDuration(sectionType, seconds);
        accumulatedRef.current = 0;
      }
    }
  }, [sectionType, onDuration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // First view
          if (!viewFired.current) {
            viewFired.current = true;
            onView(sectionType);
          }
          // Start timing
          if (visibleSince.current === null) {
            visibleSince.current = Date.now();
          }
        } else {
          // Section left viewport — accumulate time
          if (visibleSince.current !== null) {
            accumulatedRef.current += (Date.now() - visibleSince.current) / 1000;
            visibleSince.current = null;
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);

    // Flush on page hide (tab switch, close)
    const handleVisibilityChange = () => {
      if (document.hidden) flush();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Flush remaining time on unmount
      if (visibleSince.current !== null) {
        accumulatedRef.current += (Date.now() - visibleSince.current) / 1000;
        visibleSince.current = null;
      }
    };
  }, [sectionType, onView, flush]);

  // Periodic flush every 10 seconds
  useEffect(() => {
    if (!onDuration) return;
    const interval = setInterval(flush, 10_000);
    return () => {
      clearInterval(interval);
      flush(); // flush remaining on cleanup
    };
  }, [flush, onDuration]);

  return (
    <Box ref={ref} sx={sx}>
      {children}
    </Box>
  );
}
