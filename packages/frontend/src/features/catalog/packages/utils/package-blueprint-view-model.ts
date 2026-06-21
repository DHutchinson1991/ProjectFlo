import type { PackageSpaceSlot } from '@/features/workflow/locations/types/floor-plan.types';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { PackageActivityRecord } from '../types';

type PackageBlueprintSpaceSlot = PackageSpaceSlot & {
    activity_assignments?: Array<{ package_activity_id?: number | null }>;
};

export interface PackageBlueprintViewModel {
    activeSpaceSlot: PackageBlueprintSpaceSlot | null;
    visibleSpaceSlots: PackageBlueprintSpaceSlot[];
    activeActivity: PackageActivityRecord | null;
    activeMomentName: string | null;
    activeDayName: string | null;
}

interface BuildPackageBlueprintViewModelInput {
    spaceSlots: PackageBlueprintSpaceSlot[];
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    activeDayId: number | null;
    selectedActivityId: number | null;
    selectedMomentId: number | null;
    selectedSpaceSlotId?: number | null;
}

export function buildPackageBlueprintViewModel({
    spaceSlots,
    packageEventDays,
    packageActivities,
    activeDayId,
    selectedActivityId,
    selectedMomentId,
    selectedSpaceSlotId,
}: BuildPackageBlueprintViewModelInput): PackageBlueprintViewModel {
    const activeActivity =
        packageActivities.find((activity) => activity.id === selectedActivityId)
        ?? null;
    const activeMoment =
        selectedMomentId != null
            ? packageActivities
                .flatMap((activity) => activity.moments ?? [])
                .find((moment) => moment.id === selectedMomentId) ?? null
            : null;

    const dayScopedSlots = activeDayId != null
        ? spaceSlots.filter((slot) => slot.event_day_template_id === activeDayId)
        : spaceSlots;

    const activityScopedSlots = activeActivity
        ? dayScopedSlots.filter((slot) =>
            (slot.activity_assignments ?? []).some(
                (assignment) => assignment.package_activity_id === activeActivity.id,
            ),
        )
        : [];

    const visibleSpaceSlots = sortSpaceSlots(
        activityScopedSlots.length > 0 ? activityScopedSlots : dayScopedSlots,
    );

    const selectedSpaceSlot = selectedSpaceSlotId != null
        ? visibleSpaceSlots.find((slot) => slot.id === selectedSpaceSlotId)
            ?? spaceSlots.find((slot) => slot.id === selectedSpaceSlotId)
            ?? null
        : null;

    const activeSpaceSlot = selectedSpaceSlot ?? visibleSpaceSlots[0] ?? sortSpaceSlots(spaceSlots)[0] ?? null;
    const activeDayName =
        activeDayId != null
            ? packageEventDays.find((day) => day.id === activeDayId)?.name ?? null
            : null;

    return {
        activeSpaceSlot,
        visibleSpaceSlots,
        activeActivity,
        activeMomentName: activeMoment?.name ?? null,
        activeDayName,
    };
}

function sortSpaceSlots(slots: PackageBlueprintSpaceSlot[]): PackageBlueprintSpaceSlot[] {
    return [...slots].sort((left, right) => left.label.localeCompare(right.label));
}
