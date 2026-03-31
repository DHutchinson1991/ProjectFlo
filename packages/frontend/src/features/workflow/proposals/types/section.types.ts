import type { SxProps, Theme } from "@mui/material/styles";
import type { PortalThemeColors } from "@/features/workflow/proposals/utils/portal/themes";

/* ------------------------------------------------------------------ */
/* Shared section props                                                */
/* ------------------------------------------------------------------ */

/** Common props passed to every section component. */
export interface SectionBaseProps {
    colors: PortalThemeColors;
    isDark: boolean;
    cardSx: SxProps<Theme>;
}

/* ------------------------------------------------------------------ */
/* PackageData (local — not an API type)                               */
/* ------------------------------------------------------------------ */

export interface PackageItem {
    description: string;
    price: number;
    type?: string;
}

export interface PackageData {
    id: number;
    name: string;
    description: string | null;
    currency: string;
    contents?: {
        items?: PackageItem[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    } | null;
}

/* ------------------------------------------------------------------ */
/* Team tier types                                                     */
/* ------------------------------------------------------------------ */

export interface SlotGroup {
    id: number;
    roles: string[];
    assigned: boolean;
    confirmed: boolean;
    fullName: string | null;
    isAudio: boolean;
    equipment: { id: number; item_name: string }[];
}
