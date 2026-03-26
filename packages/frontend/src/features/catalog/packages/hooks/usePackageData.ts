'use client';

import { useState, useEffect, useCallback } from 'react';

import { api } from '@/lib/api';
import { rolesApi } from '@/features/content/subjects/api/roles.api';
import { type EventDay } from '@/features/workflow/scheduling/components';
import { ServicePackage } from '@/lib/types/domains/sales';
import type { JobRole } from '@/lib/types/job-roles';
import type { TaskAutoGenerationPreview } from '@/lib/types/task-library';

import type {
    SubjectType,
    CrewMemberOption,
    PackageDayOperatorRecord,
    PackageFilmRecord,
    PackageActivityRecord,
    PackageEventDaySubjectRecord,
    PackageLocationSlotRecord,
    UnmannedEquipmentRecord,
    EquipmentRecord,
} from '../types';

// ─── Options ────────────────────────────────────────────────────────
export interface UsePackageDataOptions {
    /** Resolved package id (null for new packages). */
    packageId: number | null;
    /** Current brand id from `useBrand()`. May be undefined while the provider resolves. */
    brandId: number | undefined;
}

// ─── Return type ────────────────────────────────────────────────────
export interface UsePackageDataReturn {
    // Loading / error
    isLoading: boolean;
    error: string | null;

    // Form data (read + write)
    formData: Partial<ServicePackage>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<ServicePackage>>>;

    // Reference data (read-only for the component — loaded once)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: any[];
    subjectTemplates: SubjectType[];
    crewMembers: CrewMemberOption[];
    jobRoles: JobRole[];
    allEquipment: EquipmentRecord[];

    // Reference data with external setters (component mutates these)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    films: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFilms: React.Dispatch<React.SetStateAction<any[]>>;
    unmannedEquipment: UnmannedEquipmentRecord[];
    setUnmannedEquipment: React.Dispatch<React.SetStateAction<UnmannedEquipmentRecord[]>>;

    // Package-specific data (read + write)
    packageFilms: PackageFilmRecord[];
    setPackageFilms: React.Dispatch<React.SetStateAction<PackageFilmRecord[]>>;
    packageEventDays: EventDay[];
    setPackageEventDays: React.Dispatch<React.SetStateAction<EventDay[]>>;
    packageActivities: PackageActivityRecord[];
    setPackageActivities: React.Dispatch<React.SetStateAction<PackageActivityRecord[]>>;
    packageDayOperators: PackageDayOperatorRecord[];
    setPackageDayOperators: React.Dispatch<React.SetStateAction<PackageDayOperatorRecord[]>>;
    taskPreview: TaskAutoGenerationPreview | null;
    setTaskPreview: React.Dispatch<React.SetStateAction<TaskAutoGenerationPreview | null>>;
    packageSubjects: PackageEventDaySubjectRecord[];
    setPackageSubjects: React.Dispatch<React.SetStateAction<PackageEventDaySubjectRecord[]>>;
    packageLocationSlots: PackageLocationSlotRecord[];
    setPackageLocationSlots: React.Dispatch<React.SetStateAction<PackageLocationSlotRecord[]>>;

    // Version history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packageVersions: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setPackageVersions: React.Dispatch<React.SetStateAction<any[]>>;
    versionsLoading: boolean;
    loadVersions: () => Promise<void>;

    // Actions
    reload: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────
export function usePackageData({
    packageId,
    brandId,
}: UsePackageDataOptions): UsePackageDataReturn {
    // Loading / error
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<ServicePackage>>({
        name: '',
        description: '',
        category: '',
        base_price: 0,
        contents: { items: [] },
    });

    // Reference Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [films, setFilms] = useState<any[]>([]);
    const [subjectTemplates, setSubjectTemplates] = useState<SubjectType[]>([]);
    const [packageFilms, setPackageFilms] = useState<PackageFilmRecord[]>([]);
    const [packageEventDays, setPackageEventDays] = useState<EventDay[]>([]);
    const [packageActivities, setPackageActivities] = useState<PackageActivityRecord[]>([]);

    // Crew & Operator Data
    const [crewMembers, setCrewMembers] = useState<CrewMemberOption[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [packageDayOperators, setPackageDayOperators] = useState<PackageDayOperatorRecord[]>([]);

    // Equipment Data
    const [unmannedEquipment, setUnmannedEquipment] = useState<UnmannedEquipmentRecord[]>([]);
    const [allEquipment, setAllEquipment] = useState<EquipmentRecord[]>([]);

    // Task auto-generation preview
    const [taskPreview, setTaskPreview] = useState<TaskAutoGenerationPreview | null>(null);

    // Subjects & Locations
    const [packageSubjects, setPackageSubjects] = useState<PackageEventDaySubjectRecord[]>([]);
    const [packageLocationSlots, setPackageLocationSlots] = useState<PackageLocationSlotRecord[]>([]);

    // Version History
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageVersions, setPackageVersions] = useState<any[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);

    // ── Core data loader ────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!brandId) return;
        setIsLoading(true);
        setError(null);
        try {
            const [allCats, allFilms] = await Promise.all([
                api.servicePackageCategories.getAll(brandId),
                api.films.getAll(),
            ]);
            setCategories(allCats);

            // Fetch full film details with scenes for each film
            const filmsWithDetails = await Promise.all(
                allFilms.map(film => api.films.getById(film.id).catch(() => film)),
            );
            setFilms(filmsWithDetails);

            try {
                const templates = await rolesApi.getRoles() as unknown as SubjectType[];
                setSubjectTemplates(templates || []);
            } catch (templateError) {
                console.warn('Failed to load subject templates:', templateError);
            }

            // Fetch full equipment inventory for inline addition
            try {
                const grouped = await api.equipment.getGroupedByCategory();
                const flat: EquipmentRecord[] = [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.values(grouped).forEach((group: any) => {
                    if (group && Array.isArray(group.equipment)) flat.push(...group.equipment);
                });
                setAllEquipment(flat);
            } catch {
                console.warn('Failed to load equipment inventory');
            }

            if (packageId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let pkg: any = null;
                try {
                    pkg = await api.servicePackages.getOne(brandId, packageId);
                    setFormData(pkg);
                } catch {
                    setError('Package not found');
                }

                // Load PackageFilm join table records
                try {
                    const pFilms = await api.schedule.packageFilms.getAll(packageId);
                    setPackageFilms(pFilms);
                } catch (pfError) {
                    console.warn('Failed to load package films:', pfError);
                }

                // Load Package Event Days
                try {
                    let days = await api.schedule.packageEventDays.getAll(packageId);

                    // Auto-sync: if day_coverage JSON has entries but join table is empty,
                    // create PackageEventDay records from the day_coverage keys
                    if (days.length === 0 && pkg?.contents?.day_coverage) {
                        const dayCoverageKeys = Object.keys(pkg.contents.day_coverage).map(Number).filter(Boolean);
                        if (dayCoverageKeys.length > 0) {
                            console.log('🔄 Syncing PackageEventDay records from day_coverage:', dayCoverageKeys);
                            try {
                                days = await api.schedule.packageEventDays.set(packageId, dayCoverageKeys);
                            } catch (syncErr) {
                                console.warn('Failed to sync package event days:', syncErr);
                            }
                        }
                    }

                    setPackageEventDays(days);
                } catch (edError) {
                    console.warn('Failed to load package event days:', edError);
                }

                // Load Crew Members (brand-level) and Job Roles in parallel
                try {
                    const [crew, roles] = await Promise.all([
                        api.crew.getByBrand(brandId),
                        api.jobRoles.getAll(),
                    ]);
                    setCrewMembers(crew || []);
                    setJobRoles((roles || []).filter(r => r.is_active));
                } catch (crewError) {
                    console.warn('Failed to load crew members / job roles:', crewError);
                }

                // Load Unmanned Equipment (brand-level)
                try {
                    const unmanned = await api.equipment.findUnmanned(brandId!) as unknown as UnmannedEquipmentRecord[];
                    setUnmannedEquipment(unmanned || []);
                } catch (unmannedError) {
                    console.warn('Failed to load unmanned equipment:', unmannedError);
                }

                // Load Package Day Operators
                try {
                    const dayOps = await api.operators.packageDay.getAll(packageId);

                    // Auto-cleanup: delete orphan "equipment-as-operator" placeholder records
                    const orphanOps = (dayOps || []).filter(
                        (o: PackageDayOperatorRecord) => !o.contributor_id && !o.job_role_id,
                    );
                    if (orphanOps.length > 0) {
                        await Promise.allSettled(
                            orphanOps.map((o: PackageDayOperatorRecord) =>
                                api.operators.packageDay.remove(o.id).catch(() => {/* ignore */}),
                            ),
                        );
                        setPackageDayOperators(
                            (dayOps || []).filter((o: PackageDayOperatorRecord) => !!(o.contributor_id || o.job_role_id)),
                        );
                    } else {
                        setPackageDayOperators(dayOps || []);
                    }
                } catch (doError) {
                    console.warn('Failed to load package day operators:', doError);
                }

                // Load Package Activities
                try {
                    const acts = await api.schedule.packageActivities.getAll(packageId);
                    setPackageActivities(acts || []);
                } catch (actError) {
                    console.warn('Failed to load package activities:', actError);
                }

                // Load Package Subjects
                try {
                    const subs = await api.schedule.packageEventDaySubjects.getAll(packageId);
                    setPackageSubjects(subs || []);
                } catch (subError) {
                    console.warn('Failed to load package subjects:', subError);
                }

                // Load Package Location Slots
                try {
                    const slots = await api.schedule.packageLocationSlots.getAll(packageId);
                    setPackageLocationSlots(slots || []);
                } catch (slotError) {
                    console.warn('Failed to load package location slots:', slotError);
                }

                // Load Task Auto-Generation Preview
                try {
                    const preview = await api.taskLibrary.previewAutoGeneration(packageId, brandId);
                    setTaskPreview(preview);
                } catch (previewError) {
                    console.warn('Failed to load task preview:', previewError);
                }
            } else {
                // New Package Default
                setFormData({
                    name: 'New Package',
                    description: '',
                    category: '',
                    base_price: 0,
                    contents: { items: [] },
                });

                // Still load crew members and job roles for new packages
                try {
                    const [crew, roles] = await Promise.all([
                        api.crew.getByBrand(brandId),
                        api.jobRoles.getAll(),
                    ]);
                    setCrewMembers(crew || []);
                    setJobRoles((roles || []).filter(r => r.is_active));
                } catch {
                    // ignore
                }
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [brandId, packageId]);

    // ── Version history loader ──────────────────────────────────────
    const loadVersions = useCallback(async () => {
        if (!packageId || !brandId) return;
        setVersionsLoading(true);
        try {
            const versions = await api.servicePackages.versions.getAll(brandId, packageId);
            setPackageVersions(versions);
        } catch (err) {
            console.warn('Failed to load versions:', err);
        } finally {
            setVersionsLoading(false);
        }
    }, [brandId, packageId]);

    // ── Auto-load on mount / param change ───────────────────────────
    useEffect(() => {
        if (!brandId) return;
        loadData();
    }, [brandId, packageId, loadData]);

    // ── Public API ──────────────────────────────────────────────────
    return {
        // Loading / error
        isLoading,
        error,

        // Form
        formData,
        setFormData,

        // Reference data (read-only)
        categories,
        subjectTemplates,
        crewMembers,
        jobRoles,
        allEquipment,

        // Reference data (with setters)
        films,
        setFilms,
        unmannedEquipment,
        setUnmannedEquipment,

        // Package-specific data
        packageFilms,
        setPackageFilms,
        packageEventDays,
        setPackageEventDays,
        packageActivities,
        setPackageActivities,
        packageDayOperators,
        setPackageDayOperators,
        taskPreview,
        setTaskPreview,
        packageSubjects,
        setPackageSubjects,
        packageLocationSlots,
        setPackageLocationSlots,

        // Versions
        packageVersions,
        setPackageVersions,
        versionsLoading,
        loadVersions,

        // Actions
        reload: loadData,
    };
}
