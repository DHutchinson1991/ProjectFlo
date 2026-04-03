import { createContext, useContext } from "react";
import type { RefObject } from "react";

/**
 * Provides the scroll container ref for the proposal viewer so that
 * IntersectionObserver instances inside sections can use it as their root.
 * A RefObject is used instead of the element directly to avoid timing races —
 * useEffect reads .current after the DOM commits, so the element is always ready.
 */
export const ProposalScrollContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function useProposalScrollRef(): RefObject<HTMLElement | null> | null {
    return useContext(ProposalScrollContext);
}
