import { alpha, keyframes } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PortalThemeColors } from "./themes";
import type { PublicProposalContent, PublicProposalCrewSlot } from "@/features/workflow/proposals/types";
import type { SlotGroup } from "@/features/workflow/proposals/types";

/* ------------------------------------------------------------------ */
/* Section visibility helpers                                          */
/* ------------------------------------------------------------------ */

export function isSectionVisible(content: PublicProposalContent | null, type: string): boolean {
    if (!content?.sections?.length) return true;
    const s = content.sections.find((x) => x.type === type);
    return s ? s.isVisible : true;
}

export function getSectionTitle(content: PublicProposalContent | null, type: string, fallback: string): string {
    const s = content?.sections?.find((x) => x.type === type);
    return (s?.data?.title as string) || fallback;
}

/* ------------------------------------------------------------------ */
/* Card base sx factory                                                */
/* ------------------------------------------------------------------ */

export function buildCardSx(colors: PortalThemeColors, isDark: boolean): SxProps<Theme> {
    return {
        bgcolor: isDark ? alpha(colors.card, 0.7) : colors.card,
        backdropFilter: isDark ? "blur(20px) saturate(1.5)" : "none",
        border: `1px solid ${alpha(colors.border, 0.6)}`,
        borderRadius: 4,
        overflow: "hidden",
        position: "relative" as const,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${alpha(colors.gradient1, 0.4)}, ${alpha(colors.gradient2, 0.4)}, transparent)`,
            opacity: 0,
            transition: "opacity 0.4s ease",
        },
        "&:hover": {
            borderColor: alpha(colors.accent, 0.2),
            boxShadow: `0 12px 40px ${alpha(colors.accent, isDark ? 0.1 : 0.06)}, 0 4px 12px ${alpha("#000", isDark ? 0.2 : 0.04)}`,
            transform: "translateY(-2px)",
            "&::before": { opacity: 1 },
        },
    };
}

/* ------------------------------------------------------------------ */
/* Team tier logic                                                     */
/* ------------------------------------------------------------------ */

const AUDIO_ROLES = ["sound_engineer", "sound engineer", "audio", "audio engineer"];
export const isAudioRole = (role: string) => AUDIO_ROLES.some((r) => role.toLowerCase().includes(r));

const LEADERSHIP = ["director", "producer", "lead", "coordinator", "manager", "planner"];
export const isLeadership = (role: string) => LEADERSHIP.some((r) => role.toLowerCase().includes(r));

const AUDIO_EQUIPMENT = ["mic", "rode", "wireless", "lav", "boom", "audio", "sound", "recorder"];
export const isAudioEquipment = (name: string) => AUDIO_EQUIPMENT.some((k) => name.toLowerCase().includes(k));

export function buildTeamTiers(allCrewSlots: PublicProposalCrewSlot[]) {
    const onSiteRaw = allCrewSlots.filter((s) => s.job_role.on_site);
    const offSite = allCrewSlots.filter((s) => !s.job_role.on_site);
    const leadership = offSite.filter((s) => isLeadership(s.job_role.name));
    const postProd = offSite.filter((s) => !isLeadership(s.job_role.name));

    // Merge on-site by crew_id (or keep separate if unassigned)
    const onSiteMerged: SlotGroup[] = [];
    const onSiteByCrewId = new Map<number, typeof onSiteRaw>();
    for (const slot of onSiteRaw) {
        if (slot.crew_id) {
            const existing = onSiteByCrewId.get(slot.crew_id) || [];
            existing.push(slot);
            onSiteByCrewId.set(slot.crew_id, existing);
        } else {
            const roleName = slot.label || slot.job_role.display_name || slot.job_role.name;
            onSiteMerged.push({
                id: slot.id,
                roles: [roleName],
                assigned: false,
                confirmed: false,
                fullName: null,
                isAudio: isAudioRole(slot.job_role.name),
                equipment: slot.equipment.map((e) => ({ id: e.equipment.id, item_name: e.equipment.item_name })),
            });
        }
    }
    for (const [, slots] of onSiteByCrewId) {
        const roles = slots.map((s) => s.label || s.job_role.display_name || s.job_role.name);
        const uniqueRoles = roles.filter((r, i) => roles.indexOf(r) === i);
        const first = slots[0];
        const allEquip = slots.flatMap((s) => s.equipment.map((e) => ({ id: e.equipment.id, item_name: e.equipment.item_name })));
        const uniqueEquip = allEquip.filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
        const crewFirst = first.crew?.contact?.first_name;
        const crewLast = first.crew?.contact?.last_name;
        onSiteMerged.push({
            id: first.id,
            roles: uniqueRoles,
            assigned: true,
            confirmed: slots.every((s) => s.confirmed),
            fullName: [crewFirst, crewLast].filter(Boolean).join(" ") || null,
            isAudio: slots.some((s) => isAudioRole(s.job_role.name)),
            equipment: uniqueEquip,
        });
    }

    const toSlotGroup = (slot: typeof allCrewSlots[0]): SlotGroup => {
        const cFirst = slot.crew?.contact?.first_name;
        const cLast = slot.crew?.contact?.last_name;
        return {
            id: slot.id,
            roles: [slot.label || slot.job_role.display_name || slot.job_role.name],
            assigned: !!slot.crew_id,
            confirmed: slot.confirmed,
            fullName: [cFirst, cLast].filter(Boolean).join(" ") || null,
            isAudio: isAudioRole(slot.job_role.name),
            equipment: slot.equipment.map((e) => ({ id: e.equipment.id, item_name: e.equipment.item_name })),
        };
    };

    const leadershipGroups = leadership.map(toSlotGroup);
    const postProdGroups = postProd.map(toSlotGroup);

    const assignedCount = allCrewSlots.filter((s) => !!s.crew_id).length;
    const confirmedCount = allCrewSlots.filter((s) => s.confirmed).length;
    const totalCount = allCrewSlots.length;

    return { onSiteMerged, leadershipGroups, postProdGroups, assignedCount, confirmedCount, totalCount };
}

/* ------------------------------------------------------------------ */
/* Breathe animation for assigned-not-confirmed crew                   */
/* ------------------------------------------------------------------ */

export const breathe = keyframes`
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
`;
