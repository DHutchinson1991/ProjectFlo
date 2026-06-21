import type { TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { ServicePackage, ServicePackageItem } from '../types/service-package.types';
import type {
    EquipmentRecord,
    FilmData,
    PackageActivityRecord,
    PackageCrewSlotRecord,
    PackageEventDaySubjectRecord,
    PackageLocationSlotRecord,
    UnmannedEquipmentRecord,
} from '../types';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { computeCrewCost, computeEquipmentCost } from './selectors';

export interface PackageOverviewDisplayPrice {
    amount: number;
    label: string;
    caption: string;
}

export interface PackageOverviewClientSummary {
    headline: string;
    whatWeFilm: string[];
    filmsDelivered: string[];
    highlights: string[];
}

export interface PackageOverviewAssetOverview {
    cameras: number;
    audio: number;
    lights: number;
    coverageHours: number | null;
    crewSlots: number;
    equipmentItems: number;
    unmannedCount: number;
    days: number;
    activities: number;
    moments: number;
    captureLabel: string;
    equipmentCategories: Array<{ label: string; count: number }>;
    locationNames: string[];
}

/** Mirrors inquiry-wizard package cards: content price first, then backend/enriched totals, then computed cost. */
export function resolvePackageDisplayPrice(
    packagePrice: number,
    crewCost: number,
    equipmentCost: number,
    taxRate: number,
    backendTotal?: number | null,
    backendTaxTotal?: number | null,
): PackageOverviewDisplayPrice {
    if (packagePrice > 0) {
        return {
            amount: packagePrice,
            label: 'Package price',
            caption: 'From content line items',
        };
    }

    const backendAmount = Number(backendTaxTotal ?? backendTotal ?? 0);
    if (backendAmount > 0) {
        return {
            amount: backendAmount,
            label: 'Estimated total',
            caption: backendTaxTotal ? 'Incl. tax' : 'From package pricing',
        };
    }

    const tax = computeTaxBreakdown(crewCost + equipmentCost, taxRate);
    if (tax.total > 0) {
        return {
            amount: tax.total,
            label: 'Estimated total',
            caption: 'Crew, equipment & tax',
        };
    }

    return {
        amount: 0,
        label: 'Package price',
        caption: 'Set pricing in Content',
    };
}

export type PackageOverviewActionTarget =
    | 'blueprint'
    | 'people'
    | 'locations'
    | 'roles'
    | 'equipment'
    | 'tasks'
    | 'content'
    | 'deliverables';

export interface PackageOverviewStat {
    label: string;
    value: string;
    detail: string;
}

export interface PackageOverviewDayArc {
    id: number;
    name: string;
    activityCount: number;
    momentCount: number;
    captureSeconds: number;
    captureLabel: string;
    subjectCount: number;
    spaceCount: number;
    crewCount: number;
    keyActivity: string;
    locationNames: string[];
}

export interface PackageOverviewNarrativeActivity {
    name: string;
    description?: string | null;
    moments: Array<{ name: string; durationLabel: string }>;
}

export interface PackageOverviewNarrativeMoment {
    name: string;
    activityName: string;
    durationLabel: string;
}

export interface PackageOverviewNarrative {
    suggestedSummary: string;
    activities: PackageOverviewNarrativeActivity[];
    momentSequence: PackageOverviewNarrativeMoment[];
    captureLabel: string;
    /** Client-facing angles derived from the schedule — wording to help sell the package. */
    sellingPoints: string[];
}

export interface PackageOverviewViewModel {
    packageName: string;
    categoryLabel: string;
    blueprintLabel: string | null;
    blueprintVersionLabel: string | null;
    blueprintUpdateAvailable: boolean;
    intent: string;
    stats: PackageOverviewStat[];
    totals: {
        days: number;
        activities: number;
        moments: number;
        captureSeconds: number;
        subjects: number;
        spaces: number;
        crewSlots: number;
        equipmentItems: number;
        contentItems: number;
        taskHours: number;
        crewCost: number;
        equipmentCost: number;
        /** Client-facing package price from contents line items. */
        packagePrice: number;
    };
    dayArcs: PackageOverviewDayArc[];
    narrative: PackageOverviewNarrative;
    productionFootprint: {
        subjectRoles: string[];
        locationNames: string[];
        crewRoles: string[];
        /** Full crew roster grouped by role with slot counts (not capped). */
        crewList: Array<{ role: string; count: number }>;
        equipmentCategories: Array<{ label: string; count: number }>;
        unmannedCount: number;
    };
    contentBridge: {
        filmCount: number;
        serviceCount: number;
        linkedFilmNames: string[];
        /** Full content line items with pricing (not capped). */
        items: Array<{ name: string; type: 'film' | 'service'; price: number }>;
        generatedTaskCount: number;
        estimatedTaskHours: number;
    };
    /** Client-facing summary — aligned with inquiry wizard package cards. */
    clientSummary: PackageOverviewClientSummary;
    /** Kit, crew, and production footprint for the hero asset column. */
    assetOverview: PackageOverviewAssetOverview;
}

interface BuildPackageOverviewViewModelArgs {
    formData: Partial<ServicePackage>;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    packageSubjects: PackageEventDaySubjectRecord[];
    packageLocationSlots: PackageLocationSlotRecord[];
    packageCrewSlots: PackageCrewSlotRecord[];
    allEquipment: EquipmentRecord[];
    unmannedEquipment: UnmannedEquipmentRecord[];
    films: FilmData[];
    taskPreview: TaskAutoGenerationPreview | null;
}

interface ActivityMoment {
    id: number;
    name: string;
    description?: string | null;
    duration_seconds: number;
    order_index: number;
    activityName: string;
    dayId: number;
}

const MAX_LIST_ITEMS = 4;

export function buildPackageOverviewViewModel({
    formData,
    packageEventDays,
    packageActivities,
    packageSubjects,
    packageLocationSlots,
    packageCrewSlots,
    allEquipment,
    unmannedEquipment,
    films,
    taskPreview,
}: BuildPackageOverviewViewModelArgs): PackageOverviewViewModel {
    const daysById = new Map(packageEventDays.map((day) => [day.id, day]));
    const activitiesByDay = new Map<number, PackageActivityRecord[]>();
    const moments: ActivityMoment[] = [];

    for (const activity of packageActivities) {
        const list = activitiesByDay.get(activity.package_event_day_id) ?? [];
        list.push(activity);
        activitiesByDay.set(activity.package_event_day_id, list);

        for (const moment of activity.moments ?? []) {
            moments.push({
                id: moment.id,
                name: moment.name,
                description: moment.description,
                duration_seconds: moment.duration_seconds,
                order_index: moment.order_index,
                activityName: activity.name,
                dayId: activity.package_event_day_id,
            });
        }
    }

    const subjectsByDay = new Map<number, PackageEventDaySubjectRecord[]>();
    for (const subject of packageSubjects) {
        if (!subject.event_day_template_id) continue;
        const list = subjectsByDay.get(subject.event_day_template_id) ?? [];
        list.push(subject);
        subjectsByDay.set(subject.event_day_template_id, list);
    }

    const spacesByDay = new Map<number, number>();
    const locationNamesByDay = new Map<number, Set<string>>();
    for (const location of packageLocationSlots) {
        const dayId = location.event_day_template_id;
        if (!dayId) continue;
        const locationName = location.custom_name || location.location?.name || `Location ${location.location_number}`;
        const names = locationNamesByDay.get(dayId) ?? new Set<string>();
        names.add(locationName);
        locationNamesByDay.set(dayId, names);
        spacesByDay.set(dayId, (spacesByDay.get(dayId) ?? 0) + (location.space_slots?.length ?? 0));
    }

    const crewByDay = new Map<number, PackageCrewSlotRecord[]>();
    for (const slot of packageCrewSlots) {
        const list = crewByDay.get(slot.event_day_template_id) ?? [];
        list.push(slot);
        crewByDay.set(slot.event_day_template_id, list);
    }

    const dayArcs = buildDayArcs({
        packageEventDays,
        daysById,
        activitiesByDay,
        subjectsByDay,
        spacesByDay,
        crewByDay,
        locationNamesByDay,
    });

    const captureSeconds = moments.reduce((sum, moment) => sum + safeNumber(moment.duration_seconds), 0);
    const subjectCount = packageSubjects.reduce((sum, subject) => sum + Math.max(subject.count ?? 1, 1), 0);
    const spaceCount = packageLocationSlots.reduce((sum, location) => sum + (location.space_slots?.length ?? 0), 0);
    const equipmentItems = countEquipmentItems(formData.contents, packageCrewSlots);
    const contentItems = formData.contents?.items ?? [];
    const filmCount = contentItems.filter((item) => item.type === 'film').length;
    const serviceCount = contentItems.filter((item) => item.type === 'service').length;
    const taskHours = taskPreview?.summary.total_estimated_hours ?? 0;

    const packagePrice = contentItems.reduce((sum, item) => sum + safeNumber(item.price), 0);

    const totals = {
        days: packageEventDays.length,
        activities: packageActivities.length,
        moments: moments.length,
        captureSeconds,
        subjects: subjectCount,
        spaces: spaceCount,
        crewSlots: packageCrewSlots.length,
        equipmentItems,
        contentItems: contentItems.length,
        taskHours,
        crewCost: computeCrewCost(packageCrewSlots, taskPreview),
        equipmentCost: computeEquipmentCost(formData.contents, packageCrewSlots, allEquipment),
        packagePrice,
    };

    const narrative = buildNarrative(packageActivities, moments, captureSeconds, {
        days: packageEventDays.length,
        filmCount,
        locationNames: uniqueList(packageLocationSlots.map((location) =>
            location.custom_name || location.location?.name || null,
        )),
        crewSlots: packageCrewSlots.length,
    });
    const productionFootprint = buildProductionFootprint({
        packageSubjects,
        packageLocationSlots,
        packageCrewSlots,
        allEquipment,
        unmannedEquipment,
    });
    const clientSummary = buildClientSummary(
        formData.description,
        narrative,
        contentItems,
        films,
    );
    const assetOverview = buildAssetOverview(
        formData,
        totals,
        narrative.captureLabel,
        productionFootprint,
    );
    return {
        packageName: formData.name?.trim() || 'Untitled package',
        categoryLabel: formData.category?.trim() || 'Uncategorised',
        blueprintLabel: formData.source_day_blueprint?.display_name ?? null,
        blueprintVersionLabel: formData.source_day_blueprint_version?.version_number
            ? `v${formData.source_day_blueprint_version.version_number}`
            : null,
        blueprintUpdateAvailable: Boolean(formData.blueprint_update_available),
        intent: buildIntent(formData, packageActivities, moments),
        stats: [
            { label: 'Day arc', value: pluralize(totals.days, 'day'), detail: `${totals.activities} activities mapped` },
            { label: 'Capture shape', value: formatDuration(captureSeconds), detail: `${totals.moments} planned moments` },
            { label: 'Production load', value: pluralize(totals.crewSlots, 'role'), detail: `${equipmentItems} equipment links` },
            { label: 'Outputs', value: pluralize(contentItems.length, 'item'), detail: `${filmCount} films, ${serviceCount} services` },
        ],
        totals,
        dayArcs,
        narrative,
        productionFootprint,
        contentBridge: {
            filmCount,
            serviceCount,
            linkedFilmNames: buildLinkedFilmNames(contentItems, films),
            items: buildContentItems(contentItems, films),
            generatedTaskCount: taskPreview?.summary.total_generated_tasks ?? 0,
            estimatedTaskHours: taskHours,
        },
        clientSummary,
        assetOverview,
    };
}

function buildClientSummary(
    description: string | null | undefined,
    narrative: PackageOverviewNarrative,
    contentItems: ServicePackageItem[],
    films: FilmData[],
): PackageOverviewClientSummary {
    const filmsById = new Map(films.map((film) => [film.id, film]));
    const serviceLines = contentItems
        .filter((item) => item.type === 'service')
        .map((item) => item.description?.trim())
        .filter((line): line is string => Boolean(line));
    const filmLines = contentItems
        .filter((item) => item.type === 'film')
        .map((item) => {
            const filmId = item.config?.linked_film_id ?? item.referenceId;
            const filmName = filmId ? filmsById.get(filmId)?.name : null;
            return (filmName || item.description || '').trim();
        })
        .filter((line): line is string => Boolean(line));

    const headline = description?.trim() || narrative.suggestedSummary;

    return {
        headline,
        whatWeFilm: serviceLines.slice(0, 5),
        filmsDelivered: filmLines.slice(0, 5),
        highlights: narrative.sellingPoints.slice(0, 3),
    };
}

function buildAssetOverview(
    formData: Partial<ServicePackage>,
    totals: PackageOverviewViewModel['totals'],
    captureLabel: string,
    productionFootprint: PackageOverviewViewModel['productionFootprint'],
): PackageOverviewAssetOverview {
    const eq = formData.contents?.equipment_counts;
    const eqExtended = eq as { cameras?: number; audio?: number; lights?: number } | undefined;
    return {
        cameras: eqExtended?.cameras ?? 0,
        audio: eqExtended?.audio ?? 0,
        lights: eqExtended?.lights ?? 0,
        coverageHours: formData.contents?.coverage_hours ?? null,
        crewSlots: totals.crewSlots,
        equipmentItems: totals.equipmentItems,
        unmannedCount: productionFootprint.unmannedCount,
        days: totals.days,
        activities: totals.activities,
        moments: totals.moments,
        captureLabel,
        equipmentCategories: productionFootprint.equipmentCategories,
        locationNames: productionFootprint.locationNames,
    };
}

function buildDayArcs({
    packageEventDays,
    daysById,
    activitiesByDay,
    subjectsByDay,
    spacesByDay,
    crewByDay,
    locationNamesByDay,
}: {
    packageEventDays: EventDay[];
    daysById: Map<number, EventDay>;
    activitiesByDay: Map<number, PackageActivityRecord[]>;
    subjectsByDay: Map<number, PackageEventDaySubjectRecord[]>;
    spacesByDay: Map<number, number>;
    crewByDay: Map<number, PackageCrewSlotRecord[]>;
    locationNamesByDay: Map<number, Set<string>>;
}): PackageOverviewDayArc[] {
    const dayIds = packageEventDays.length > 0
        ? packageEventDays.map((day) => day.id)
        : Array.from(activitiesByDay.keys());

    return dayIds.map((dayId, index) => {
        const activities = [...(activitiesByDay.get(dayId) ?? [])].sort(compareOrder);
        const captureSeconds = activities.reduce(
            (sum, activity) => sum + (activity.moments ?? []).reduce((momentSum, moment) => momentSum + safeNumber(moment.duration_seconds), 0),
            0,
        );
        const keyActivity = activities.reduce<PackageActivityRecord | null>((best, activity) => {
            if (!best) return activity;
            return (activity.moments?.length ?? 0) > (best.moments?.length ?? 0) ? activity : best;
        }, null);
        const subjects = subjectsByDay.get(dayId) ?? [];

        return {
            id: dayId,
            name: daysById.get(dayId)?.name ?? `Day ${index + 1}`,
            activityCount: activities.length,
            momentCount: activities.reduce((sum, activity) => sum + (activity.moments?.length ?? 0), 0),
            captureSeconds,
            captureLabel: formatDuration(captureSeconds),
            subjectCount: subjects.reduce((sum, subject) => sum + Math.max(subject.count ?? 1, 1), 0),
            spaceCount: spacesByDay.get(dayId) ?? 0,
            crewCount: crewByDay.get(dayId)?.length ?? 0,
            keyActivity: keyActivity?.name ?? 'No anchor activity yet',
            locationNames: Array.from(locationNamesByDay.get(dayId) ?? []).slice(0, MAX_LIST_ITEMS),
        };
    });
}

function buildNarrative(
    packageActivities: PackageActivityRecord[],
    moments: ActivityMoment[],
    captureSeconds: number,
    context: {
        days: number;
        filmCount: number;
        locationNames: string[];
        crewSlots: number;
    },
): PackageOverviewNarrative {
    const orderedActivities = [...packageActivities].sort(compareOrder);
    const orderedMoments = [...moments].sort((a, b) => {
        if (a.dayId !== b.dayId) return a.dayId - b.dayId;
        return a.order_index - b.order_index;
    });

    const activities: PackageOverviewNarrativeActivity[] = orderedActivities.map((activity) => ({
        name: activity.name,
        description: activity.description,
        moments: [...(activity.moments ?? [])]
            .sort(compareOrder)
            .map((moment) => ({
                name: moment.name,
                durationLabel: formatDuration(safeNumber(moment.duration_seconds)),
            })),
    }));

    const momentSequence: PackageOverviewNarrativeMoment[] = orderedMoments.map((moment) => ({
        name: moment.name,
        activityName: moment.activityName,
        durationLabel: formatDuration(moment.duration_seconds),
    }));

    return {
        suggestedSummary: buildSuggestedNarrativeSummary(orderedActivities, orderedMoments, captureSeconds),
        activities,
        momentSequence,
        captureLabel: formatDuration(captureSeconds),
        sellingPoints: buildSellingPoints(orderedActivities, orderedMoments, captureSeconds, context),
    };
}

function buildSellingPoints(
    packageActivities: PackageActivityRecord[],
    moments: ActivityMoment[],
    captureSeconds: number,
    context: {
        days: number;
        filmCount: number;
        locationNames: string[];
        crewSlots: number;
    },
): string[] {
    const points: string[] = [];

    if (captureSeconds > 0 && moments.length > 0) {
        points.push(
            `${formatDuration(captureSeconds)} of planned coverage across ${moments.length} crafted moments — nothing on the day is left to chance.`,
        );
    }

    const anchor = packageActivities.reduce<PackageActivityRecord | null>((best, activity) => {
        if (!best) return activity;
        return (activity.moments?.length ?? 0) > (best.moments?.length ?? 0) ? activity : best;
    }, null);
    if (anchor && (anchor.moments?.length ?? 0) > 0) {
        points.push(
            `Anchored around ${anchor.name.toLowerCase()}, with ${anchor.moments?.length} dedicated moments so the heart of the day gets the deepest coverage.`,
        );
    }

    const longestMoment = moments.reduce<ActivityMoment | null>((best, moment) => {
        if (!best) return moment;
        return safeNumber(moment.duration_seconds) > safeNumber(best.duration_seconds) ? moment : best;
    }, null);
    if (longestMoment && safeNumber(longestMoment.duration_seconds) > 0) {
        points.push(
            `"${longestMoment.name}" is given ${formatDuration(safeNumber(longestMoment.duration_seconds))} of focused filming — space to capture it properly, not rushed.`,
        );
    }

    if (context.locationNames.length > 1) {
        points.push(
            `The story moves through ${joinHumanList(context.locationNames.slice(0, 3))}, giving the final films real visual variety.`,
        );
    }

    if (context.crewSlots > 0) {
        points.push(
            `${pluralize(context.crewSlots, 'crew role')} planned in advance, so every moment has the right person pointing the right lens.`,
        );
    }

    if (context.filmCount > 0) {
        points.push(
            `Everything is shot with ${pluralize(context.filmCount, 'finished film')} in mind — coverage maps directly to what gets delivered.`,
        );
    }

    return points;
}

function buildSuggestedNarrativeSummary(
    packageActivities: PackageActivityRecord[],
    moments: ActivityMoment[],
    captureSeconds: number,
): string {
    const activityNames = packageActivities.map((activity) => activity.name).filter(Boolean);
    const momentNames = moments.map((moment) => moment.name).filter(Boolean);

    if (activityNames.length === 0 && momentNames.length === 0) {
        return 'Describe how this package tells the story — activity and moment names will help shape a suggested narrative as you build the day.';
    }

    const activityPhrase = activityNames.length > 0
        ? `flows through ${joinHumanList(activityNames.slice(0, 4))}`
        : 'is still taking shape';
    const momentPhrase = momentNames.length > 0
        ? `, capturing ${joinHumanList(momentNames.slice(0, 5))}`
        : '';
    const capturePhrase = captureSeconds > 0
        ? ` across ${formatDuration(captureSeconds)} of planned coverage`
        : '';

    return `This package ${activityPhrase}${momentPhrase}${capturePhrase}.`;
}

function buildProductionFootprint({
    packageSubjects,
    packageLocationSlots,
    packageCrewSlots,
    allEquipment,
    unmannedEquipment,
}: {
    packageSubjects: PackageEventDaySubjectRecord[];
    packageLocationSlots: PackageLocationSlotRecord[];
    packageCrewSlots: PackageCrewSlotRecord[];
    allEquipment: EquipmentRecord[];
    unmannedEquipment: UnmannedEquipmentRecord[];
}): PackageOverviewViewModel['productionFootprint'] {
    const subjectRoles = uniqueList(packageSubjects.map((subject) =>
        subject.role_template?.role_name || subject.name,
    ));
    const locationNames = uniqueList(packageLocationSlots.map((location) =>
        location.custom_name || location.location?.name || `Location ${location.location_number}`,
    ));
    const crewRoles = uniqueList(packageCrewSlots.map((slot) =>
        slot.job_role?.display_name || slot.job_role?.name || slot.label || 'Crew role',
    ));
    const crewCounts = new Map<string, number>();
    for (const slot of packageCrewSlots) {
        const role = slot.job_role?.display_name || slot.job_role?.name || slot.label || 'Crew role';
        crewCounts.set(role, (crewCounts.get(role) ?? 0) + 1);
    }
    const equipmentById = new Map(allEquipment.map((item) => [item.id, item]));
    const categoryCounts = new Map<string, number>();

    for (const slot of packageCrewSlots) {
        for (const linked of slot.equipment ?? []) {
            const category = linked.equipment?.category || equipmentById.get(linked.equipment_id)?.category || 'Equipment';
            categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
        }
    }

    return {
        subjectRoles: subjectRoles.slice(0, MAX_LIST_ITEMS),
        locationNames: locationNames.slice(0, MAX_LIST_ITEMS),
        crewRoles: crewRoles.slice(0, MAX_LIST_ITEMS),
        crewList: Array.from(crewCounts.entries())
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role)),
        equipmentCategories: Array.from(categoryCounts.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, MAX_LIST_ITEMS),
        unmannedCount: unmannedEquipment.length,
    };
}

function buildIntent(
    formData: Partial<ServicePackage>,
    packageActivities: PackageActivityRecord[],
    moments: ActivityMoment[],
): string {
    const description = formData.description?.trim();
    if (description) return description;

    const activityNames = packageActivities
        .slice(0, 3)
        .map((activity) => activity.name)
        .filter(Boolean);
    if (activityNames.length > 0) {
        return `Designed around ${joinHumanList(activityNames)}, with ${moments.length} planned moments shaping the final coverage.`;
    }

    return 'A production brief will emerge here as days, activities, people, locations, and outputs are added.';
}

function buildContentItems(
    contentItems: ServicePackageItem[],
    films: FilmData[],
): Array<{ name: string; type: 'film' | 'service'; price: number }> {
    const filmsById = new Map(films.map((film) => [film.id, film]));
    return contentItems.map((item) => {
        const filmId = item.type === 'film' ? (item.config?.linked_film_id ?? item.referenceId) : null;
        const filmName = filmId ? filmsById.get(filmId)?.name : null;
        return {
            name: (filmName || item.description || 'Untitled item').trim(),
            type: item.type,
            price: safeNumber(item.price),
        };
    });
}

function buildLinkedFilmNames(contentItems: ServicePackageItem[], films: FilmData[]): string[] {
    const filmsById = new Map(films.map((film) => [film.id, film]));
    return contentItems
        .filter((item) => item.type === 'film')
        .map((item) => {
            const filmId = item.config?.linked_film_id ?? item.referenceId;
            return filmId ? filmsById.get(filmId)?.name || item.description : item.description;
        })
        .filter((name): name is string => Boolean(name?.trim()))
        .slice(0, MAX_LIST_ITEMS);
}

function countEquipmentItems(
    contents: Partial<ServicePackage>['contents'] | undefined,
    packageCrewSlots: PackageCrewSlotRecord[],
): number {
    const ids = new Set<number>();
    for (const slot of packageCrewSlots) {
        for (const item of slot.equipment ?? []) {
            ids.add(item.equipment_id);
        }
    }
    for (const items of Object.values(contents?.day_equipment ?? {})) {
        for (const item of items) {
            ids.add(item.equipment_id);
        }
    }
    for (const items of Object.values(contents?.activity_equipment ?? {})) {
        for (const item of items) {
            ids.add(item.equipment_id);
        }
    }
    for (const item of contents?.extra_equipment ?? []) {
        ids.add(item.equipment_id);
    }
    return ids.size;
}

function uniqueList(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function compareOrder(a: { order_index?: number }, b: { order_index?: number }): number {
    return (a.order_index ?? 0) - (b.order_index ?? 0);
}

function safeNumber(value: number | string | null | undefined): number {
    const next = Number(value);
    return Number.isFinite(next) ? next : 0;
}

function formatDuration(seconds: number): string {
    if (seconds <= 0) return '0m';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

function joinHumanList(values: string[]): string {
    if (values.length <= 1) return values[0] ?? '';
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}
