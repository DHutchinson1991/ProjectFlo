'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, Grid, FormControl, 
    Select, MenuItem, Checkbox,
    IconButton, Breadcrumbs, Link, CircularProgress, Alert,
    Stack, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Menu,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import InventoryIcon from '@mui/icons-material/Inventory';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import BuildIcon from '@mui/icons-material/Build';
import PlaceIcon from '@mui/icons-material/Place';
import LinkIcon from '@mui/icons-material/Link';

import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';

import { api } from '@/lib/api';
import { type EventDayTemplate } from '@/components/schedule';
import { createLinkedFilmFromTemplate } from '@/lib/utils/packageFilmLinker';
import { ServicePackage, ServicePackageItem } from '@/lib/types/domains/sales';
import type { JobRole } from '@/lib/types/job-roles';
import type { TaskAutoGenerationPreview } from '@/lib/types/task-library';
import { useBrand } from '@/app/providers/BrandProvider';
import { formatCurrency } from '@/lib/utils/formatUtils';
import { request } from '@/hooks/utils/api';
import { PackageScheduleCard } from '@/components/schedule/PackageScheduleCard';
import { ActivitiesCard } from '@/components/schedule/ActivitiesCard';
import { ActivityFilmWizard } from '@/components/schedule/ActivityFilmWizard';
import PackageCreationWizard from '../components/PackageCreationWizard';
import { TaskAutoGenCard } from '../components/TaskAutoGenCard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// ─── PackageFilm join table type ─────────────────────────────────────
interface PackageFilmRecord {
    id: number;
    package_id: number;
    film_id: number;
    order_index: number;
    notes?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    film?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene_schedules?: any[];
}

interface SubjectTypeTemplate {
    id: number;
    name: string;
    description?: string | null;
    category: string;
    roles: Array<{ id: number; role_name: string; is_core: boolean }>;
}

// Equipment templates removed — equipment is added directly with track numbering

// Crew member from crew API (for assignment dropdowns)
interface CrewMemberOption {
    id: number;
    contact: {
        first_name?: string | null;
        last_name?: string | null;
        email: string;
    };
    crew_color?: string | null;
    contributor_job_roles: Array<{
        is_primary: boolean;
        job_role: { id: number; name: string; display_name?: string | null };
    }>;
}

interface PackageDayOperatorRecord {
    id: number;
    package_id: number;
    event_day_template_id: number;
    contributor_id?: number | null;
    package_activity_id?: number | null;
    position_name: string;
    position_color?: string | null;
    job_role_id?: number | null;
    hours: number;
    notes?: string | null;
    order_index: number;
    contributor?: {
        id: number;
        crew_color?: string | null;
        default_hourly_rate?: number | string | null;
        contact: { id: number; first_name?: string | null; last_name?: string | null; email: string };
        contributor_job_roles?: Array<{
            is_primary: boolean;
            is_unmanned?: boolean;
            job_role_id?: number;
            job_role: { id: number; name: string; display_name?: string | null };
            payment_bracket?: {
                id: number;
                name: string;
                display_name?: string | null;
                level: number;
                hourly_rate?: number | string | null;
                day_rate?: number | string | null;
            } | null;
        }>;
    } | null;
    job_role?: { id: number; name: string; display_name?: string | null; category?: string | null } | null;
    equipment: Array<{
        id: number;
        equipment_id: number;
        is_primary: boolean;
        equipment?: { id: number; item_name: string; model?: string | null; category?: string };
    }>;
    event_day?: { id: number; name: string };
    package_activity?: { id: number; name: string } | null;
    activity_assignments?: Array<{
        id: number;
        package_activity_id: number;
        package_activity?: { id: number; name: string };
    }>;
}

/** Resolve the effective hourly rate for a crew operator:
 *  1. Payment bracket rate matching the operator's job_role (best)
 *  2. Any payment bracket rate on the contributor (fallback)
 *  3. Contributor's default_hourly_rate
 *  Returns 0 if nothing is set. */
function getCrewHourlyRate(op: PackageDayOperatorRecord): number {
    const c = op.contributor;
    if (!c) return 0;
    const roles = c.contributor_job_roles || [];
    // Try to find the bracket matching the operator's assigned job_role first
    if (op.job_role_id) {
        const match = roles.find(r => r.job_role_id === op.job_role_id && r.payment_bracket?.hourly_rate);
        if (match?.payment_bracket?.hourly_rate) return Number(match.payment_bracket.hourly_rate);
    }
    // Fallback: primary role bracket
    const primary = roles.find(r => r.is_primary && r.payment_bracket?.hourly_rate);
    if (primary?.payment_bracket?.hourly_rate) return Number(primary.payment_bracket.hourly_rate);
    // Fallback: any bracket
    const any = roles.find(r => r.payment_bracket?.hourly_rate);
    if (any?.payment_bracket?.hourly_rate) return Number(any.payment_bracket.hourly_rate);
    // Fallback: contributor default
    if (c.default_hourly_rate) return Number(c.default_hourly_rate);
    return 0;
}

/** Check if an operator is a day-rate role (has day_rate but no hourly_rate on the matching bracket).
 *  These roles (e.g. Production) are costed per day, not per hour. */
function isCrewDayRate(op: PackageDayOperatorRecord): boolean {
    const c = op.contributor;
    if (!c) return false;
    const roles = c.contributor_job_roles || [];
    if (op.job_role_id) {
        const match = roles.find((r: any) => r.job_role_id === op.job_role_id);
        if (match?.payment_bracket) {
            const dayRate = Number(match.payment_bracket.day_rate || 0);
            const hourlyRate = Number(match.payment_bracket.hourly_rate || 0);
            return dayRate > 0 && hourlyRate === 0;
        }
    }
    return false;
}

/** Get the day rate for a day-rate operator. Returns 0 if not found. */
function getCrewDayRate(op: PackageDayOperatorRecord): number {
    const c = op.contributor;
    if (!c) return 0;
    const roles = c.contributor_job_roles || [];
    if (op.job_role_id) {
        const match = roles.find((r: any) => r.job_role_id === op.job_role_id && r.payment_bracket?.day_rate);
        if (match?.payment_bracket?.day_rate) return Number(match.payment_bracket.day_rate);
    }
    // Fallback: primary role bracket
    const primary = roles.find((r: any) => r.is_primary && r.payment_bracket?.day_rate);
    if (primary?.payment_bracket?.day_rate) return Number(primary.payment_bracket.day_rate);
    return 0;
}

/** Build a map of (crewName|roleName) → total task hours from the auto-generation preview.
 *  Excludes day-rate roles from hourly aggregation. */
function buildTaskHoursMap(preview: TaskAutoGenerationPreview | null): Map<string, number> {
    const map = new Map<string, number>();
    if (!preview?.tasks) return map;
    for (const task of preview.tasks) {
        if (!task.assigned_to_name || !task.role_name) continue;
        const key = `${task.assigned_to_name}|${task.role_name}`;
        map.set(key, (map.get(key) || 0) + task.total_hours);
    }
    return map;
}

export default function PackageEditPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id;
    const packageId = params.id === 'new' ? null : Number(params.id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Form State
    const [formData, setFormData] = useState<Partial<ServicePackage>>({
        name: '',
        description: '',
        category: '',
        base_price: 0,
        contents: { items: [] }
    });

    // Reference Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [films, setFilms] = useState<any[]>([]);
    const [subjectTemplates, setSubjectTemplates] = useState<SubjectTypeTemplate[]>([]);
    // equipmentTemplates state removed — equipment is managed directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [packageFilms, setPackageFilms] = useState<PackageFilmRecord[]>([]);
    const [packageEventDays, setPackageEventDays] = useState<EventDayTemplate[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageActivities, setPackageActivities] = useState<any[]>([]);

    // Crew & Operator State
    const [crewMembers, setCrewMembers] = useState<CrewMemberOption[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [packageDayOperators, setPackageDayOperators] = useState<PackageDayOperatorRecord[]>([]);
    const [operatorMenuAnchor, setOperatorMenuAnchor] = useState<null | HTMLElement>(null);
    const [operatorMenuDayId, setOperatorMenuDayId] = useState<number | null>(null);
    // Crew assignment menu — assign a crew member to an existing role slot
    const [crewAssignAnchor, setCrewAssignAnchor] = useState<null | HTMLElement>(null);
    const [crewAssignSlotId, setCrewAssignSlotId] = useState<number | null>(null);
    // Multi-role picker dialog — select which roles a crew member should fill
    const [rolePickerOpen, setRolePickerOpen] = useState(false);
    const [rolePickerCrewMember, setRolePickerCrewMember] = useState<CrewMemberOption | null>(null);
    const [rolePickerSelectedIds, setRolePickerSelectedIds] = useState<number[]>([]);
    const [rolePickerSaving, setRolePickerSaving] = useState(false);

    // Unmanned Equipment State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [unmannedEquipment, setUnmannedEquipment] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageUnmannedEquipment, setPackageUnmannedEquipment] = useState<any[]>([]);

    // Equipment-Operator inline assignment state
    const [equipAssignAnchor, setEquipAssignAnchor] = useState<null | HTMLElement>(null);
    const [equipAssignTarget, setEquipAssignTarget] = useState<{ equipmentId: number; currentOpId?: number } | null>(null);

    // Inline equipment addition state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allEquipment, setAllEquipment] = useState<any[]>([]);
    const [addEquipAnchor, setAddEquipAnchor] = useState<null | HTMLElement>(null);
    const [addEquipType, setAddEquipType] = useState<'CAMERA' | 'AUDIO'>('CAMERA');
    const [trackPickerAnchor, setTrackPickerAnchor] = useState<null | HTMLElement>(null);
    const [trackPickerTarget, setTrackPickerTarget] = useState<{ equipmentId: number; slotType: 'CAMERA' | 'AUDIO' } | null>(null);

    // Schedule active day — shared between Schedule card and Crew & Equipment card
    const [scheduleActiveDayId, setScheduleActiveDayId] = useState<number | null>(null);
    // Selected activity — clicking an activity row highlights it and filters other cards
    const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
    // Live colour preview while the edit-activity dialog is open
    const [activityColorOverrides, setActivityColorOverrides] = useState<Record<number, string>>({});

    // Task auto-generation preview — used for crew card task-hours-per-role display
    const [taskPreview, setTaskPreview] = useState<TaskAutoGenerationPreview | null>(null);

    // Subjects State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageSubjects, setPackageSubjects] = useState<any[]>([]);
    const [addSubjectMenuAnchor, setAddSubjectMenuAnchor] = useState<null | HTMLElement>(null);
    const [addSubjectDayId, setAddSubjectDayId] = useState<number | null>(null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCategory, setNewSubjectCategory] = useState('PEOPLE');

    // Locations State (abstract numbered slots 1-5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageLocationSlots, setPackageLocationSlots] = useState<any[]>([]);

    // Item Adding State
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newItemType, setNewItemType] = useState<'film' | 'service'>('film');
    const [selectedFilmId, setSelectedFilmId] = useState<string>('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [activityWizardOpen, setActivityWizardOpen] = useState(false);

    // Package Creation Wizard State
    const [packageCreationWizardOpen, setPackageCreationWizardOpen] = useState(false);

    // Preview & Version History State
    const [previewOpen, setPreviewOpen] = useState(false);
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [packageVersions, setPackageVersions] = useState<any[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);

    useEffect(() => {
        if (!safeBrandId) return; // Wait until brand context has resolved
        loadData();
    }, [safeBrandId, packageId]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [allCats, allFilms] = await Promise.all([
                api.servicePackageCategories.getAll(safeBrandId),
                api.films.getAll(),
            ]);
            setCategories(allCats);
            
            // Fetch full film details with scenes for each film
            const filmsWithDetails = await Promise.all(
                allFilms.map(film => api.films.getById(film.id).catch(() => film))
            );
            setFilms(filmsWithDetails);

            try {
                const templates = await request<SubjectTypeTemplate[]>(
                    `/subjects/type-templates/brand/${safeBrandId}`,
                    {},
                    { includeBrandQuery: false }
                );
                setSubjectTemplates(templates || []);
            } catch (templateError) {
                console.warn('Failed to load subject templates:', templateError);
            }

            // Equipment templates no longer loaded — equipment is added directly

            // Fetch full equipment inventory for inline addition
            try {
                const grouped = await api.equipment.getGroupedByCategory();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const flat: any[] = [];
                // Each value is { category, label, count, equipment: [...], expanded }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.values(grouped).forEach((group: any) => {
                    if (group && Array.isArray(group.equipment)) flat.push(...group.equipment);
                });
                setAllEquipment(flat);
            } catch {
                console.warn('Failed to load equipment inventory');
            }

            if (packageId) {
                // Use getOne endpoint for direct lookup instead of filtering from getAll
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let pkg: any = null;
                try {
                    pkg = await api.servicePackages.getOne(safeBrandId, packageId);
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
                        api.crew.getByBrand(safeBrandId),
                        api.jobRoles.getAll(),
                    ]);
                    setCrewMembers(crew || []);
                    setJobRoles((roles || []).filter(r => r.is_active));
                } catch (crewError) {
                    console.warn('Failed to load crew members / job roles:', crewError);
                }

                // Load Unmanned Equipment (brand-level)
                try {
                    const unmanned = await request<any[]>(
                        `/equipment/unmanned/${safeBrandId}`,
                        {},
                        { includeBrandQuery: false }
                    );
                    setUnmannedEquipment(unmanned || []);
                } catch (unmannedError) {
                    console.warn('Failed to load unmanned equipment:', unmannedError);
                }

                // Load Package Day Operators
                try {
                    const dayOps = await api.operators.packageDay.getAll(packageId);

                    // Auto-cleanup: delete orphan "equipment-as-operator" placeholder records
                    // that have no contributor and no job role. These were created by older
                    // wizard code and should not appear in the Crew card.
                    const orphanOps = (dayOps || []).filter(
                        (o: PackageDayOperatorRecord) => !o.contributor_id && !o.job_role_id
                    );
                    if (orphanOps.length > 0) {
                        await Promise.allSettled(
                            orphanOps.map((o: PackageDayOperatorRecord) =>
                                api.operators.packageDay.remove(o.id).catch(() => {/* ignore */})
                            )
                        );
                        // Keep only real crew operators
                        setPackageDayOperators(
                            (dayOps || []).filter((o: PackageDayOperatorRecord) => !!(o.contributor_id || o.job_role_id))
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

                // Load Package Location Slots (abstract numbered locations 1-5)
                try {
                    const slots = await api.schedule.packageLocationSlots.getAll(packageId);
                    setPackageLocationSlots(slots || []);
                } catch (slotError) {
                    console.warn('Failed to load package location slots:', slotError);
                }

                // Load Task Auto-Generation Preview (for crew card hours-per-role)
                try {
                    const preview = await api.taskLibrary.previewAutoGeneration(packageId, safeBrandId);
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
                    contents: { items: [] }
                });

                // Still load crew members and job roles for new packages
                try {
                    const [crew, roles] = await Promise.all([
                        api.crew.getByBrand(safeBrandId),
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
    };

    const handleSave = async () => {
        if (!formData.name) return alert('Name is required');
        setIsSaving(true);
        try {
            let savedPkgId = packageId;
            if (packageId) {
                await api.servicePackages.update(safeBrandId, packageId, formData);
            } else {
                const newPkg = await api.servicePackages.create(safeBrandId, formData);
                savedPkgId = newPkg.id;
                router.replace(`/designer/packages/${newPkg.id}`);
            }

            // Sync PackageFilm records for any film items that don't have one
            if (savedPkgId) {
                const items = formData.contents?.items || [];
                let needsUpdate = false;
                const updatedItems = [...items];
                
                for (let i = 0; i < updatedItems.length; i++) {
                    const item = updatedItems[i];
                    if (item.type === 'film' && item.referenceId && !item.config?.package_film_id) {
                        try {
                            const filmId = item.config?.linked_film_id ?? item.referenceId;
                            const pf = await api.schedule.packageFilms.create(savedPkgId, {
                                film_id: filmId,
                                order_index: i,
                            });
                            updatedItems[i] = {
                                ...item,
                                config: { ...item.config, package_film_id: pf.id },
                            };
                            setPackageFilms(prev => [...prev, pf]);
                            needsUpdate = true;
                        } catch (pfErr) {
                            console.warn('Failed to sync package film record:', pfErr);
                        }
                    }
                }
                
                // Save again if we updated items with package_film_ids
                if (needsUpdate) {
                    const updated = { ...formData, contents: { ...formData.contents, items: updatedItems } };
                    await api.servicePackages.update(safeBrandId, savedPkgId, updated);
                    setFormData(updated);
                }

                // Auto-create a version snapshot after successful save
                try {
                    await api.servicePackages.versions.create(safeBrandId, savedPkgId);
                } catch (vErr) {
                    console.warn('Failed to create version snapshot:', vErr);
                }
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Version History helpers ────────────────────────────────────────
    const loadVersions = async () => {
        if (!packageId || !safeBrandId) return;
        setVersionsLoading(true);
        try {
            const versions = await api.servicePackages.versions.getAll(safeBrandId, packageId);
            setPackageVersions(versions);
        } catch (err) {
            console.warn('Failed to load versions:', err);
        } finally {
            setVersionsLoading(false);
        }
    };

    const handleOpenVersionHistory = () => {
        loadVersions();
        setVersionHistoryOpen(true);
    };

    const handleRestoreVersion = async (versionId: number) => {
        if (!packageId || !safeBrandId) return;
        try {
            const restored = await api.servicePackages.versions.restore(safeBrandId, packageId, versionId);
            setFormData(restored);
            await loadVersions();
        } catch (err) {
            console.error('Failed to restore version:', err);
            alert('Failed to restore version');
        }
    };

    const handleAddItem = async () => {
        const items = [...(formData.contents?.items || [])];
        
        if (newItemType === 'film') {
            const film = films.find(f => f.id === Number(selectedFilmId));
            if (!film) return;
            
            const itemId = Math.random().toString(36).substr(2, 9);
            
            // Create PackageFilm record if package is already saved
            let packageFilmId: number | null = null;
            if (packageId) {
                try {
                    const pf = await api.schedule.packageFilms.create(packageId, {
                        film_id: film.id,
                        order_index: items.filter(i => i.type === 'film').length,
                    });
                    packageFilmId = pf.id;
                    setPackageFilms(prev => [...prev, pf]);
                } catch (pfErr) {
                    console.warn('Failed to create package film record:', pfErr);
                }
            }
            
            items.push({
                id: itemId,
                type: 'film',
                referenceId: film.id,
                description: film.name,
                price: 0,
                config: {
                    subject_template_id: formData.contents?.subject_template_id ?? null,
                    package_film_id: packageFilmId,
                } 
            });
            setSelectedFilmId('');
        } else {
            if (!serviceDescription) return;
            items.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'service',
                description: serviceDescription,
                price: 0
            });
            setServiceDescription('');
        }
        
        setFormData({ ...formData, contents: { ...formData.contents, items } });
        setAddDialogOpen(false);
    };

    const handleRemoveItem = async (index: number) => {
        const items = [...(formData.contents?.items || [])];
        const removedItem = items[index];
        
        // Delete the corresponding PackageFilm record if it exists
        if (removedItem?.config?.package_film_id) {
            try {
                await api.schedule.packageFilms.delete(removedItem.config.package_film_id);
                setPackageFilms(prev => prev.filter(pf => pf.id !== removedItem.config?.package_film_id));
            } catch (pfErr) {
                console.warn('Failed to delete package film record:', pfErr);
            }
        }
        
        items.splice(index, 1);
        setFormData({ ...formData, contents: { ...formData.contents, items } });
    };

    const getFilmStats = (filmId: number) => {
        const film = films.find(f => f.id === filmId);
        if (!film?.scenes) return { realtime: 0, montage: 0, totalDuration: '0:00' };
        
        const realtime = film.scenes.filter((s: Record<string, unknown>) => s.mode === 'MOMENTS' || !s.mode).length;
        const montage = film.scenes.filter((s: Record<string, unknown>) => s.mode === 'MONTAGE').length;
        
        // Calculate total duration from beats and moments within scenes
        let totalSeconds = 0;
        for (const scene of film.scenes) {
            // First try scene-level duration
            if (scene.duration_seconds) {
                totalSeconds += scene.duration_seconds;
                continue;
            }
            // Then try summing beats
            const sceneRecord = scene as Record<string, unknown>;
            if (Array.isArray(sceneRecord.beats) && sceneRecord.beats.length > 0) {
                totalSeconds += (sceneRecord.beats as Array<{ duration_seconds?: number }>).reduce((sum, b) => sum + (b.duration_seconds || 0), 0);
                continue;
            }
            // Then try summing moments
            if (scene.moments?.length) {
                totalSeconds += (scene.moments as Array<{ duration?: number }>).reduce((sum, m) => sum + (m.duration || 0), 0);
            }
        }
        
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const totalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        return { realtime, montage, totalDuration };
    };

    const handleConfigureItem = async (item: ServicePackageItem) => {
        if (!item.id) return;

        const ensurePackageSaved = async (): Promise<number> => {
            if (packageId) {
                await api.servicePackages.update(safeBrandId, packageId, formData);
                return packageId;
            }

            if (!confirm('You need to save the package before configuring items. Save now?')) {
                throw new Error('Package save cancelled');
            }

            const newPkg = await api.servicePackages.create(safeBrandId, formData);
            setFormData(newPkg);
            router.replace(`/designer/packages/${newPkg.id}`);
            return newPkg.id;
        };

        setIsSaving(true);
        try {
            const savedPackageId = await ensurePackageSaved();

            const linkedFilmId = item.config?.linked_film_id;
            if (linkedFilmId) {
                // Equipment is managed directly on the package — no template sync needed
                const activityParam = item.config?.activity_id ? `&activityId=${item.config.activity_id}` : '';
                router.push(`/designer/films/${linkedFilmId}?packageId=${savedPackageId}&itemId=${item.id}${activityParam}`);
                return;
            }

            if (!item.referenceId) {
                alert('No film template selected for this package item.');
                return;
            }

            const newLinkedFilmId = await createLinkedFilmFromTemplate({
                templateFilmId: item.referenceId,
                brandId: safeBrandId,
                packageName: formData.name,
                itemDescription: item.description,
                subjectTemplateId: formData.contents?.subject_template_id ?? null,
            });

            // Create PackageFilm record for the new linked film
            let packageFilmId = item.config?.package_film_id ?? null;
            if (!packageFilmId) {
                try {
                    const pf = await api.schedule.packageFilms.create(savedPackageId, {
                        film_id: newLinkedFilmId,
                        order_index: (formData.contents?.items || []).findIndex(i => i.id === item.id),
                    });
                    packageFilmId = pf.id;
                    setPackageFilms(prev => [...prev, pf]);
                } catch (pfErr) {
                    console.warn('Failed to create package film record:', pfErr);
                }
            }

            const updatedItems = (formData.contents?.items || []).map((existingItem) =>
                existingItem.id === item.id
                    ? {
                          ...existingItem,
                          config: {
                              ...existingItem.config,
                              linked_film_id: newLinkedFilmId,
                              template_film_id: item.referenceId,
                              subject_template_id: formData.contents?.subject_template_id ?? null,
                              package_film_id: packageFilmId,
                          },
                      }
                    : existingItem
            );

            const updatedPackage = {
                ...formData,
                contents: { ...formData.contents, items: updatedItems },
            };

            await api.servicePackages.update(safeBrandId, savedPackageId, updatedPackage);
            setFormData(updatedPackage);

            const activityParam2 = item.config?.activity_id ? `&activityId=${item.config.activity_id}` : '';
            router.push(`/designer/films/${newLinkedFilmId}?packageId=${savedPackageId}&itemId=${item.id}${activityParam2}`);
        } catch (e) {
            if ((e as Error).message !== 'Package save cancelled') {
                console.error(e);
                alert('Failed to open film configuration');
            }
        } finally {
            setIsSaving(false);
        }
    };



    if (isLoading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;

    // ─── Dark-card base style (matches inquiry page aesthetic) ───────
    const cardSx = {
        background: 'rgba(16, 18, 22, 0.8)',
        borderRadius: 3,
        border: '1px solid rgba(52, 58, 68, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1920, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 1.5, '& .MuiBreadcrumbs-separator': { color: '#475569' } }}>
                    <Link underline="hover" sx={{ color: '#64748b' }} href="/designer/packages">Packages</Link>
                    <Typography sx={{ color: '#94a3b8' }}>{formData.name || 'New Package'}</Typography>
                </Breadcrumbs>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 0.5 }}>
                    <IconButton onClick={() => router.push('/designer/packages')} sx={{ color: '#94a3b8', mt: 0.5 }}><ArrowBackIcon /></IconButton>
                    
                    {/* Inline-editable package name */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, maxWidth: '100%' }}>
                            <Box
                                component="input"
                                value={formData.name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Package Name"
                                size={Math.max(8, (formData.name || 'Package Name').length + 1)}
                                sx={{
                                    background: 'none', border: 'none', outline: 'none',
                                    fontWeight: 800, color: '#f1f5f9', fontSize: '1.8rem',
                                    fontFamily: 'inherit', lineHeight: 1.2,
                                    p: 0, m: 0,
                                    borderBottom: '2px solid transparent',
                                    transition: 'border-color 0.2s ease',
                                    '&:hover': { borderColor: 'rgba(255,255,255,0.08)' },
                                    '&:focus': { borderColor: '#648CFF' },
                                    '&::placeholder': { color: '#334155' },
                                }}
                            />
                            {/* Category — minimal inline select */}
                            <FormControl size="small" variant="standard" sx={{ minWidth: 0, flexShrink: 0 }}>
                                <Select
                                    value={formData.category || ''}
                                    displayEmpty
                                    onChange={(e) => {
                                        const newCategory = e.target.value as string;
                                        setFormData(prev => {
                                            const updated = { ...prev, category: newCategory };
                                            const matchedSubject = subjectTemplates.find(t =>
                                                t.category?.toLowerCase() === newCategory.toLowerCase()
                                                || t.name?.toLowerCase().includes(newCategory.toLowerCase().split(' ')[0])
                                            );
                                            if (matchedSubject) {
                                                updated.contents = {
                                                    ...updated.contents,
                                                    items: updated.contents?.items || [],
                                                    subject_template_id: matchedSubject.id,
                                                };
                                            }
                                            return updated;
                                        });
                                    }}
                                    disableUnderline
                                    renderValue={(val) => (
                                        <Typography sx={{
                                            fontSize: '0.85rem', fontWeight: 600,
                                            color: val ? '#94a3b8' : '#475569',
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                        }}>
                                            {val || 'Add category…'}
                                        </Typography>
                                    )}
                                    sx={{
                                        color: '#94a3b8', fontSize: '0.85rem',
                                        px: 1, py: 0.25, borderRadius: 1.5,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        transition: 'all 0.15s ease',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
                                        '& .MuiSelect-icon': { color: '#475569', fontSize: '1.1rem' },
                                        '& .MuiSelect-select': { p: '2px 24px 2px 0 !important' },
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 },
                                        },
                                    }}
                                >
                                    {/* Include current category as option if not in the fetched list */}
                                    {formData.category && !categories.some((cat) => cat.name === formData.category) && (
                                        <MenuItem value={formData.category} sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                                            {formData.category}
                                        </MenuItem>
                                    )}
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.name} sx={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Description — inline editable text underneath */}
                        <Box
                            component="input"
                            value={formData.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Add a description…"
                            sx={{
                                display: 'block', width: '100%',
                                background: 'none', border: 'none', outline: 'none',
                                fontSize: '0.85rem', color: '#64748b', fontFamily: 'inherit',
                                fontWeight: 400, lineHeight: 1.5, p: 0, mt: 0.5,
                                borderBottom: '1px solid transparent',
                                transition: 'all 0.2s ease',
                                '&:hover': { color: '#94a3b8', borderColor: 'rgba(255,255,255,0.06)' },
                                '&:focus': { color: '#e2e8f0', borderColor: 'rgba(100, 140, 255, 0.3)' },
                                '&::placeholder': { color: '#334155', fontStyle: 'italic' },
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                        {/* Create Related Package Button */}
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => setPackageCreationWizardOpen(true)}
                            sx={{
                                borderColor: 'rgba(245, 158, 11, 0.35)',
                                color: '#f59e0b',
                                '&:hover': { borderColor: 'rgba(245, 158, 11, 0.6)', bgcolor: 'rgba(245, 158, 11, 0.08)' },
                                borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: 'none', fontSize: '0.85rem',
                            }}
                        >
                            New Package
                        </Button>

                        {/* Preview Button */}
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<VisibilityIcon />}
                            onClick={() => setPreviewOpen(true)}
                            sx={{
                                borderColor: 'rgba(16, 185, 129, 0.35)',
                                color: '#10b981',
                                '&:hover': { borderColor: 'rgba(16, 185, 129, 0.6)', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                                borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: 'none', fontSize: '0.85rem',
                            }}
                        >
                            Preview
                        </Button>

                        {/* Version History Button */}
                        <Tooltip title="Version History">
                            <IconButton
                                onClick={handleOpenVersionHistory}
                                sx={{
                                    color: '#8b5cf6',
                                    bgcolor: 'rgba(139, 92, 246, 0.08)',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    borderRadius: 2,
                                    width: 44, height: 44,
                                    '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.45)' },
                                }}
                            >
                                <HistoryIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                        </Tooltip>

                        {/* Save Button */}
                        <Button 
                            variant="contained" 
                            size="large" 
                            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={isSaving}
                            sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' }}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* ── Total Cost Summary Card (top right) ── */}
            {(() => {
                // Calculate total crew cost (mirrors the Crew card TOTAL logic)
                const taskHoursMap = buildTaskHoursMap(taskPreview);
                const totalCrewCost = packageDayOperators.reduce((sum, op) => {
                    // Only count operators with a contributor or job role (real crew)
                    if (!op.contributor_id && !op.job_role_id) return sum;
                    if (isCrewDayRate(op)) {
                        return sum + getCrewDayRate(op) * Number(op.hours || 1);
                    }
                    const crewName = op.contributor
                        ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                        : '';
                    const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                    const taskKey = crewName && roleName ? `${crewName}|${roleName}` : null;
                    const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                    const rate = getCrewHourlyRate(op);
                    const hours = taskHours > 0 ? taskHours : Number(op.hours || 0);
                    return sum + rate * hours;
                }, 0);

                // Calculate total equipment cost from allEquipment rental prices
                type EquipItemCost = { equipment_id: number; slot_type: string };
                type EquipContentsShape = {
                    day_equipment?: Record<string, EquipItemCost[]>;
                };
                const eqContents = (formData.contents || {}) as EquipContentsShape;
                const dayEquipMap = eqContents.day_equipment || {};
                // Gather all unique equipment IDs across all event days
                const allEquipIds = new Set<number>();
                Object.values(dayEquipMap).forEach(items => {
                    (items || []).forEach(item => allEquipIds.add(item.equipment_id));
                });
                // Also gather equipment from relational operator-equipment links
                packageDayOperators.forEach(op => {
                    (op.equipment || []).forEach(eq => allEquipIds.add(eq.equipment_id));
                });
                const totalEquipCost = Array.from(allEquipIds).reduce((sum, eqId) => {
                    const fullEq = allEquipment.find((e: { id: number; rental_price_per_day?: number }) => e.id === eqId);
                    return sum + (fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0);
                }, 0);

                const totalCost = totalCrewCost + totalEquipCost;
                const currency = currentBrand?.currency || 'USD';

                return (
                    <Box sx={{
                        display: 'flex', justifyContent: 'flex-end', mb: 2.5,
                    }}>
                        <Box sx={{
                            ...cardSx,
                            display: 'flex', alignItems: 'center', gap: 3,
                            px: 3, py: 2,
                            minWidth: 320,
                            background: 'linear-gradient(135deg, rgba(16, 18, 22, 0.9), rgba(16, 18, 22, 0.8))',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                        }}>
                            {/* Crew cost */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PeopleIcon sx={{ fontSize: 13, color: '#EC4899' }} />
                                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        Crew
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.85rem', color: totalCrewCost > 0 ? '#e2e8f0' : '#475569', fontWeight: 700, fontFamily: 'monospace' }}>
                                    {formatCurrency(totalCrewCost, currency)}
                                </Typography>
                            </Box>

                            <Typography sx={{ color: '#334155', fontSize: '1rem', fontWeight: 300 }}>+</Typography>

                            {/* Equipment cost */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <VideocamIcon sx={{ fontSize: 13, color: '#10b981' }} />
                                    <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                        Equipment
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.85rem', color: totalEquipCost > 0 ? '#e2e8f0' : '#475569', fontWeight: 700, fontFamily: 'monospace' }}>
                                    {formatCurrency(totalEquipCost, currency)}
                                </Typography>
                            </Box>

                            <Typography sx={{ color: '#334155', fontSize: '1rem', fontWeight: 300 }}>=</Typography>

                            {/* Total cost */}
                            <Box sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25,
                                pl: 1.5, borderLeft: '1px solid rgba(245, 158, 11, 0.2)',
                            }}>
                                <Typography sx={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Total Cost
                                </Typography>
                                <Typography sx={{
                                    fontSize: '1.2rem',
                                    color: totalCost > 0 ? '#f59e0b' : '#475569',
                                    fontWeight: 800,
                                    fontFamily: 'monospace',
                                    fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {formatCurrency(totalCost, currency)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                );
            })()}

            {/* ── Schedule Card (Full-width row) ── */}
            <Box sx={{ mb: 2.5 }}>
                <PackageScheduleCard
                    packageId={packageId}
                    brandId={safeBrandId}
                    packageEventDays={packageEventDays}
                    setPackageEventDays={setPackageEventDays}
                    packageDayOperators={packageDayOperators}
                    dayCoverage={formData.contents?.day_coverage}
                    onDayCoverageChange={(dayId, cov) => {
                        setFormData(prev => {
                            const items = prev.contents?.items || [];
                            return {
                                ...prev,
                                contents: {
                                    ...prev.contents,
                                    items,
                                    day_coverage: {
                                        ...(prev.contents?.day_coverage || {}),
                                        [dayId]: cov,
                                    },
                                },
                            };
                        });
                    }}
                    cardSx={cardSx}
                    activeDayId={scheduleActiveDayId}
                    onActiveDayChange={(dayId) => { setScheduleActiveDayId(dayId); setSelectedActivityId(null); }}
                    selectedActivityId={selectedActivityId}
                    onSelectedActivityChange={setSelectedActivityId}
                    onActivityTimeChange={async (activityId, startTime, endTime) => {
                        try {
                            await api.schedule.packageActivities.update(activityId, {
                                start_time: startTime,
                                end_time: endTime,
                            });
                            // Update parent activities state so ActivitiesCard stays in sync
                            setPackageActivities(prev => prev.map(a =>
                                a.id === activityId
                                    ? { ...a, start_time: startTime, end_time: endTime }
                                    : a
                            ));
                        } catch (err) {
                            console.error('Failed to update activity time:', err);
                        }
                    }}
                    colorOverrides={activityColorOverrides}
                />
            </Box>


            {/* ── Grid with columns ── */}
            <Grid container spacing={2.5}>
                {/* ────── Column 1: Activities ────── */}
                <Grid item xs={12} md={5}>
                    {/* Activities Card */}
                    <Box>
                        <ActivitiesCard
                            packageId={packageId}
                            packageEventDays={packageEventDays}
                            activities={packageActivities}
                            setActivities={setPackageActivities}
                            activeDayId={scheduleActiveDayId}
                            cardSx={cardSx}
                            packageSubjects={packageSubjects}
                            setPackageSubjects={setPackageSubjects}
                            packageLocationSlots={packageLocationSlots}
                            setPackageLocationSlots={setPackageLocationSlots}
                            packageDayOperators={packageDayOperators}
                            setPackageDayOperators={setPackageDayOperators}
                            selectedActivityId={selectedActivityId}
                            onSelectedActivityChange={setSelectedActivityId}
                            onColorPreview={(activityId, color) => {
                                if (activityId == null || color == null) {
                                    setActivityColorOverrides({});
                                } else {
                                    setActivityColorOverrides({ [activityId]: color });
                                }
                            }}
                        />
                    </Box>
                </Grid>

                {/* ─── Add Item Dialog ─── */}
                <Dialog
                    open={addDialogOpen}
                    onClose={() => setAddDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { background: 'rgba(16, 18, 22, 0.95)', border: '1px solid rgba(52, 58, 68, 0.4)', borderRadius: 3, backdropFilter: 'blur(20px)' } }}
                >
                    <DialogTitle sx={{ pb: 1 }} component="div">
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Add to Package</Typography>
                        <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>Choose what to add to this package</Typography>
                    </DialogTitle>
                    <DialogContent sx={{ pb: 1 }}>
                        {/* Type selection tabs */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                            <Chip
                                icon={<VideoLibraryIcon sx={{ fontSize: '16px !important' }} />}
                                label="Film"
                                onClick={() => setNewItemType('film')}
                                sx={{
                                    flex: 1, height: 40, fontWeight: 600, fontSize: '0.85rem',
                                    bgcolor: newItemType === 'film' ? 'rgba(100, 140, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                                    color: newItemType === 'film' ? '#648CFF' : '#94a3b8',
                                    border: `1px solid ${newItemType === 'film' ? 'rgba(100, 140, 255, 0.35)' : 'rgba(52, 58, 68, 0.3)'}`,
                                    '& .MuiChip-icon': { color: newItemType === 'film' ? '#648CFF' : '#64748b' },
                                    '&:hover': { bgcolor: newItemType === 'film' ? 'rgba(100, 140, 255, 0.2)' : 'rgba(255,255,255,0.06)' },
                                }}
                            />
                            <Chip
                                icon={<InventoryIcon sx={{ fontSize: '16px !important' }} />}
                                label="Service"
                                onClick={() => setNewItemType('service')}
                                sx={{
                                    flex: 1, height: 40, fontWeight: 600, fontSize: '0.85rem',
                                    bgcolor: newItemType === 'service' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                                    color: newItemType === 'service' ? '#10b981' : '#94a3b8',
                                    border: `1px solid ${newItemType === 'service' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(52, 58, 68, 0.3)'}`,
                                    '& .MuiChip-icon': { color: newItemType === 'service' ? '#10b981' : '#64748b' },
                                    '&:hover': { bgcolor: newItemType === 'service' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)' },
                                }}
                            />
                        </Box>

                        {/* From Activities shortcut */}
                        {packageActivities.length > 0 && (
                            <Box
                                onClick={() => { setAddDialogOpen(false); setActivityWizardOpen(true); }}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    p: 1.5, mb: 2, borderRadius: 2, cursor: 'pointer',
                                    bgcolor: 'rgba(167, 139, 250, 0.06)',
                                    border: '1px solid rgba(167, 139, 250, 0.2)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.35)' },
                                }}
                            >
                                <AutoAwesomeIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#e2e8f0' }}>
                                        Create from Activities
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                        Auto-create scenes &amp; moments from your schedule
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.7rem' }}>
                                    {packageActivities.length} activit{packageActivities.length !== 1 ? 'ies' : 'y'}
                                </Typography>
                            </Box>
                        )}

                        {/* Film picker */}
                        {newItemType === 'film' && (
                            <Stack spacing={2}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Select Film Template</Typography>
                                <Stack spacing={1}>
                                    {films.map((f) => {
                                        const isSelected = selectedFilmId === String(f.id);
                                        const sceneCount = f.scenes?.length || 0;
                                        return (
                                            <Box
                                                key={f.id}
                                                onClick={() => setSelectedFilmId(String(f.id))}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                                    p: 1.5, borderRadius: 2, cursor: 'pointer',
                                                    bgcolor: isSelected ? 'rgba(100, 140, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                                    border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.35)' : 'rgba(52, 58, 68, 0.25)'}`,
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': { bgcolor: isSelected ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.45)' : 'rgba(52, 58, 68, 0.45)'}` },
                                                }}
                                            >
                                                <Box sx={{
                                                    width: 32, height: 32, borderRadius: 1.5,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: isSelected ? 'rgba(100, 140, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                                                    flexShrink: 0,
                                                }}>
                                                    <VideoLibraryIcon sx={{ fontSize: 16, color: isSelected ? '#648CFF' : '#64748b' }} />
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: isSelected ? '#f1f5f9' : '#94a3b8' }}>
                                                        {f.name}
                                                    </Typography>
                                                    {sceneCount > 0 && (
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                                            {sceneCount} scene{sceneCount !== 1 ? 's' : ''}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {isSelected && (
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#648CFF', flexShrink: 0 }} />
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Stack>
                        )}

                        {/* Service input */}
                        {newItemType === 'service' && (
                            <Stack spacing={2}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Service Details</Typography>
                                <TextField
                                    label="Service Description"
                                    size="small"
                                    fullWidth
                                    autoFocus
                                    value={serviceDescription}
                                    onChange={(e) => setServiceDescription(e.target.value)}
                                    placeholder="e.g. Drone coverage, Second shooter..."
                                />
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                        <Button onClick={() => setAddDialogOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleAddItem}
                            disabled={newItemType === 'film' ? !selectedFilmId : !serviceDescription}
                            sx={{ bgcolor: '#648CFF', '&:hover': { bgcolor: '#5A7BF0' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
                        >
                            {newItemType === 'film' ? 'Add Film' : 'Add Service'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ─── Activity Film Wizard ─── */}
                {packageId && (
                    <ActivityFilmWizard
                        open={activityWizardOpen}
                        onClose={() => setActivityWizardOpen(false)}
                        packageId={packageId}
                        activities={packageActivities}
                        packageName={formData.name || undefined}
                        onFilmCreated={(result) => {
                            // Add the new film to the package contents items
                            const items = [...(formData.contents?.items || [])];
                            // Pre-populate activity_id when created from exactly one activity
                            const singleActivityId = result.activityIds?.length === 1 ? result.activityIds[0] : null;
                            items.push({
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'film',
                                referenceId: result.filmId,
                                description: result.filmName,
                                price: 0,
                                config: {
                                    linked_film_id: result.filmId,
                                    subject_template_id: formData.contents?.subject_template_id ?? null,
                                    package_film_id: result.packageFilmId,
                                    activity_id: singleActivityId,
                                },
                            });
                            setFormData({ ...formData, contents: { ...formData.contents, items } });

                            // Refresh films list to include the new one
                            api.films.getById(result.filmId).then(newFilm => {
                                setFilms(prev => [...prev, newFilm]);
                            }).catch(() => {});

                            // Refresh package films
                            api.schedule.packageFilms.getAll(packageId).then(pfs => {
                                setPackageFilms(pfs);
                            }).catch(() => {});
                        }}
                    />
                )}

                {/* ────── Column 2: Subjects ────── */}
                <Grid item xs={12} md={3.5}>
                    <Stack spacing={2}>

                        {/* ── Subjects Card ── */}
                        {(() => {
                            const activeEventDayId = scheduleActiveDayId || packageEventDays[0]?.id;
                            const activeDay = packageEventDays.find(d => d.id === activeEventDayId);
                            const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const daySubjects = packageSubjects.filter((s: any) => s.event_day_template_id === activeEventDayId);

                            // ── Multi-activity subject assignments (DB-backed via activity_assignments) ──
                            const isSubjectAssigned = (s: any) => { // eslint-disable-line
                                if (!selectedActivityId) return true;
                                if (s.activity_assignments && s.activity_assignments.length > 0) {
                                    return s.activity_assignments.some((a: any) => a.package_activity_id === selectedActivityId);
                                }
                                // Legacy fallback
                                if (s.package_activity_id) return s.package_activity_id === selectedActivityId;
                                return false; // no explicit assignment — click to assign
                            };

                            const toggleSubjectActivity = async (s: any) => { // eslint-disable-line
                                if (!selectedActivityId) return;
                                try {
                                    const assigned = isSubjectAssigned(s);
                                    let updatedSubj;
                                    if (assigned) {
                                        updatedSubj = await api.schedule.packageEventDaySubjects.unassignActivity(s.id, selectedActivityId);
                                    } else {
                                        updatedSubj = await api.schedule.packageEventDaySubjects.assignActivity(s.id, selectedActivityId);
                                    }
                                    // Update local state with the returned subject (includes activity_assignments)
                                    setPackageSubjects(prev => prev.map((sub: any) => sub.id === s.id ? { ...sub, ...updatedSubj } : sub));
                                } catch (err) {
                                    console.warn('Failed to toggle subject activity:', err);
                                }
                            };
                            // Find templates whose name matches the active day (e.g. "Wedding" matches "Wedding Day")
                            const matchedTemplates = subjectTemplates.filter(t =>
                                activeDay && (
                                    activeDay.name.toLowerCase().includes(t.name.toLowerCase()) ||
                                    t.name.toLowerCase().includes(activeDay.name.toLowerCase().split(' ')[0])
                                )
                            );
                            const existingNames = new Set(daySubjects.map((s: any) => s.name));
                            // Suggested roles from matched templates not yet added
                            const suggestedRoles = matchedTemplates.flatMap(t => t.roles).filter(r => !existingNames.has(r.role_name));

                            return (
                                <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                                    {/* Card Header */}
                                    <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                                                    <PeopleIcon sx={{ fontSize: 14, color: '#a78bfa' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subjects</Typography>
                                                    {selectedActivity ? (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
                                                    ) : activeDay && packageEventDays.length > 1 ? (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{activeDay.name}</Typography>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                            {daySubjects.length > 0 && (
                                                <Chip label={`${daySubjects.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                                        {/* Existing subjects */}
                                        {daySubjects.map((subj: any) => {
                                            const subjAssigned = isSubjectAssigned(subj);
                                            return (
                                            <Box
                                                key={subj.id}
                                                onClick={() => {
                                                    if (!selectedActivityId) return;
                                                    toggleSubjectActivity(subj);
                                                }}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1,
                                                    py: 0.5, px: 1, mx: -1, borderRadius: 1.5,
                                                    transition: 'all 0.2s ease',
                                                    opacity: subjAssigned ? 1 : 0.3,
                                                    cursor: selectedActivityId ? 'pointer' : 'default',
                                                    '&:hover': {
                                                        bgcolor: selectedActivityId ? 'rgba(167, 139, 250, 0.12)' : 'rgba(167, 139, 250, 0.05)',
                                                        opacity: selectedActivityId && !subjAssigned ? 0.7 : (subjAssigned ? 1 : 0.3),
                                                        '& .subj-del': { opacity: !selectedActivityId ? 1 : (subjAssigned ? 1 : 0) },
                                                    },
                                                }}
                                            >
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: '#a78bfa' }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.72rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {subj.name}
                                                    </Typography>
                                                    {subj.category && (
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: -0.2, textTransform: 'capitalize' }}>
                                                            {(subj.category as string).toLowerCase()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box className="subj-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await api.schedule.packageEventDaySubjects.delete(subj.id);
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                setPackageSubjects(prev => prev.filter((s: any) => s.id !== subj.id));
                                                            } catch (err) { console.warn('Failed to remove subject:', err); }
                                                        }}
                                                        sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 11 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            );
                                        })}

                                        {/* Template suggestions: show if matched template has unassigned roles */}
                                        {suggestedRoles.length > 0 && (
                                            <Box sx={{ mt: daySubjects.length > 0 ? 1.5 : 0 }}>
                                                {daySubjects.length === 0 && (
                                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.58rem', display: 'block', mb: 0.75 }}>
                                                        From {matchedTemplates.map(t => t.name).join(', ')} template:
                                                    </Typography>
                                                )}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {suggestedRoles.map(role => (
                                                        <Chip
                                                            key={role.id}
                                                            label={role.role_name}
                                                            size="small"
                                                            onClick={async () => {
                                                                if (!activeEventDayId || !packageId) return;
                                                                try {
                                                                    const created = await api.schedule.packageEventDaySubjects.create(packageId, {
                                                                        event_day_template_id: activeEventDayId,
                                                                        name: role.role_name,
                                                                        category: 'PEOPLE',
                                                                        role_template_id: role.id,
                                                                    });
                                                                    // Auto-assign to selected activity via DB
                                                                    if (selectedActivityId && created?.id) {
                                                                        const assignedSubj = await api.schedule.packageEventDaySubjects.assignActivity(created.id, selectedActivityId);
                                                                        setPackageSubjects(prev => [...prev, { ...created, ...assignedSubj }]);
                                                                    } else {
                                                                        setPackageSubjects(prev => [...prev, created]);
                                                                    }
                                                                } catch (err) { console.warn('Failed to add subject:', err); }
                                                            }}
                                                            icon={<AddIcon sx={{ fontSize: '10px !important' }} />}
                                                            sx={{
                                                                height: 20, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                                                                bgcolor: 'rgba(167, 139, 250, 0.07)', color: '#a78bfa',
                                                                border: '1px dashed rgba(167, 139, 250, 0.3)',
                                                                '& .MuiChip-icon': { color: '#a78bfa' },
                                                                '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.15)', borderStyle: 'solid' },
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Add custom subject button */}
                                        <Box sx={{ mt: (daySubjects.length > 0 || suggestedRoles.length > 0) ? 1.5 : 0.5, display: 'flex', justifyContent: 'center' }}>
                                            {packageId && packageEventDays.length > 0 && (
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                                    onClick={(e) => {
                                                        setAddSubjectMenuAnchor(e.currentTarget);
                                                        setAddSubjectDayId(activeEventDayId || null);
                                                        setNewSubjectName('');
                                                        setNewSubjectCategory('PEOPLE');
                                                    }}
                                                    sx={{ fontSize: '0.6rem', color: '#a78bfa', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.06)' } }}
                                                >
                                                    Add Custom Subject
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })()}

                        {/* ── Locations Card (numbered slots 1-5) ── */}
                        {(() => {
                            const activeEventDayId = scheduleActiveDayId || packageEventDays[0]?.id;
                            const activeDay = packageEventDays.find(d => d.id === activeEventDayId);
                            const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const daySlots = packageLocationSlots.filter((s: any) => s.event_day_template_id === activeEventDayId);
                            const isSlotAssigned = (slot: any) => !selectedActivityId || slot.activity_assignments?.some((a: any) => a.package_activity_id === selectedActivityId); // eslint-disable-line
                            const maxSlots = 5;
                            return (
                                <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                                    {/* Card Header */}
                                    <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                    <PlaceIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Locations</Typography>
                                                    {selectedActivity ? (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
                                                    ) : activeDay && packageEventDays.length > 1 ? (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{activeDay.name}</Typography>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                            {daySlots.length > 0 && (
                                                <Chip
                                                    label={`${selectedActivityId ? daySlots.filter((s: any) => isSlotAssigned(s)).length : daySlots.length}`}
                                                    size="small"
                                                    sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', '& .MuiChip-label': { px: 0.6 } }}
                                                />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                                        {daySlots.length === 0 && (
                                            <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem', textAlign: 'center', py: 1 }}>
                                                {selectedActivity ? 'No location slots for this day' : 'No location slots — add up to 5'}
                                            </Typography>
                                        )}
                                        {daySlots.map((slot: any) => {
                                            const assigned = isSlotAssigned(slot);
                                            // When an activity is selected, show count for that activity only;
                                            // show total count otherwise so dimmed slots don't show misleading numbers.
                                            const assignedCount = selectedActivityId
                                                ? (slot.activity_assignments?.filter((a: any) => a.package_activity_id === selectedActivityId).length || 0)
                                                : (slot.activity_assignments?.length || 0);
                                            return (
                                                <Box
                                                    key={slot.id}
                                                    onClick={async () => {
                                                        if (!selectedActivityId || !packageId) return;
                                                        try {
                                                            if (assigned) {
                                                                const updated = await api.schedule.packageLocationSlots.unassignActivity(slot.id, selectedActivityId);
                                                                setPackageLocationSlots(prev => prev.map((s: any) => s.id === slot.id ? { ...s, ...updated } : s));
                                                            } else {
                                                                const updated = await api.schedule.packageLocationSlots.assignActivity(slot.id, selectedActivityId);
                                                                setPackageLocationSlots(prev => prev.map((s: any) => s.id === slot.id ? { ...s, ...updated } : s));
                                                            }
                                                        } catch (err) { console.warn('Failed to toggle location slot:', err); }
                                                    }}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, mx: -1, borderRadius: 1.5,
                                                        transition: 'all 0.2s ease',
                                                        opacity: assigned ? 1 : 0.3,
                                                        cursor: selectedActivityId ? 'pointer' : 'default',
                                                        '&:hover': {
                                                            bgcolor: selectedActivityId ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                                                            '& .slot-del': { opacity: 1 },
                                                        },
                                                    }}
                                                >
                                                    <PlaceIcon sx={{ fontSize: 12, color: '#f59e0b', flexShrink: 0 }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.72rem', color: '#f1f5f9' }}>
                                                            Location {slot.location_number}
                                                        </Typography>
                                                        {assignedCount > 0 && (
                                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: -0.2 }}>
                                                                {assignedCount} {assignedCount === 1 ? 'activity' : 'activities'}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Box className="slot-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await api.schedule.packageLocationSlots.delete(slot.id);
                                                                    setPackageLocationSlots(prev => prev.filter((s: any) => s.id !== slot.id));
                                                                } catch (err) { console.warn('Failed to remove location slot:', err); }
                                                            }}
                                                            sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 11 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                        <Box sx={{ mt: daySlots.length > 0 ? 1 : 0.25, display: 'flex', justifyContent: 'center' }}>
                                            {packageId && packageEventDays.length > 0 && daySlots.length < maxSlots && (
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                                    onClick={async () => {
                                                        if (!activeEventDayId || !packageId) return;
                                                        try {
                                                            const created = await api.schedule.packageLocationSlots.create(packageId, {
                                                                event_day_template_id: activeEventDayId,
                                                            });
                                                            setPackageLocationSlots(prev => [...prev, created]);
                                                        } catch (err) { console.warn('Failed to add location slot:', err); }
                                                    }}
                                                    sx={{ fontSize: '0.6rem', color: '#f59e0b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.06)' } }}
                                                >
                                                    Add Location
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })()}

                        {/* Subject Add Menu */}
                        <Menu
                            anchorEl={addSubjectMenuAnchor}
                            open={Boolean(addSubjectMenuAnchor)}
                            onClose={() => { setAddSubjectMenuAnchor(null); setAddSubjectDayId(null); setNewSubjectName(''); }}
                            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 240 } }}
                        >
                            <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75 }}>
                                    Custom Subject
                                </Typography>
                                <TextField
                                    autoFocus
                                    size="small"
                                    placeholder="Name (e.g. Bride, Groom...)"
                                    value={newSubjectName}
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && newSubjectName.trim() && addSubjectDayId && packageId) {
                                            try {
                                                const created = await api.schedule.packageEventDaySubjects.create(packageId, {
                                                    event_day_template_id: addSubjectDayId,
                                                    name: newSubjectName.trim(),
                                                    category: newSubjectCategory,
                                                });
                                                // Auto-assign to selected activity via DB
                                                if (selectedActivityId && created?.id) {
                                                    const assignedSubj = await api.schedule.packageEventDaySubjects.assignActivity(created.id, selectedActivityId);
                                                    setPackageSubjects(prev => [...prev, { ...created, ...assignedSubj }]);
                                                } else {
                                                    setPackageSubjects(prev => [...prev, created]);
                                                }
                                                setNewSubjectName('');
                                                setAddSubjectMenuAnchor(null);
                                                setAddSubjectDayId(null);
                                            } catch (err) { console.warn('Failed to add subject:', err); }
                                        }
                                    }}
                                    InputProps={{ sx: { fontSize: '0.75rem', color: '#f1f5f9', bgcolor: 'rgba(255,255,255,0.04)', '& fieldset': { borderColor: 'rgba(167, 139, 250, 0.3)' }, '&:hover fieldset': { borderColor: 'rgba(167, 139, 250, 0.5)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } } }}
                                    sx={{ mb: 0.75, width: '100%' }}
                                />
                                <Select
                                    size="small"
                                    value={newSubjectCategory}
                                    onChange={e => setNewSubjectCategory(e.target.value)}
                                    sx={{ width: '100%', fontSize: '0.7rem', color: '#e2e8f0', bgcolor: 'rgba(255,255,255,0.04)', '& fieldset': { borderColor: 'rgba(167, 139, 250, 0.2)' }, '& .MuiSelect-icon': { color: '#64748b' } }}
                                >
                                    <MenuItem value="PEOPLE" sx={{ fontSize: '0.7rem' }}>People</MenuItem>
                                    <MenuItem value="OBJECTS" sx={{ fontSize: '0.7rem' }}>Objects</MenuItem>
                                    <MenuItem value="LOCATIONS" sx={{ fontSize: '0.7rem' }}>Locations</MenuItem>
                                </Select>
                            </Box>
                            {newSubjectName.trim() && (
                                <Box sx={{ px: 1.5, py: 0.75 }}>
                                    <Button
                                        size="small"
                                        fullWidth
                                        onClick={async () => {
                                            if (!newSubjectName.trim() || !addSubjectDayId || !packageId) return;
                                            try {
                                                const created = await api.schedule.packageEventDaySubjects.create(packageId, {
                                                    event_day_template_id: addSubjectDayId,
                                                    name: newSubjectName.trim(),
                                                    category: newSubjectCategory,
                                                });
                                                // Auto-assign to selected activity via DB
                                                if (selectedActivityId && created?.id) {
                                                    const assignedSubj = await api.schedule.packageEventDaySubjects.assignActivity(created.id, selectedActivityId);
                                                    setPackageSubjects(prev => [...prev, { ...created, ...assignedSubj }]);
                                                } else {
                                                    setPackageSubjects(prev => [...prev, created]);
                                                }
                                                setNewSubjectName('');
                                                setAddSubjectMenuAnchor(null);
                                                setAddSubjectDayId(null);
                                            } catch (err) { console.warn('Failed to add subject:', err); }
                                        }}
                                        sx={{ fontSize: '0.65rem', color: '#a78bfa', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'rgba(167, 139, 250, 0.1)' } }}
                                    >
                                        Add &quot;{newSubjectName.trim()}&quot;
                                    </Button>
                                </Box>
                            )}
                        </Menu>

                    </Stack>
                </Grid>


                {/* ────── Column 3: Crew, Equipment, Package Contents ────── */}
                <Grid item xs={12} md={3.5}>
                    <Stack spacing={2}>

                        {/* ── Crew Card ── */}
                        {(() => {
                            // Filter operators for the active day, then exclude equipment-only
                            // placeholder operators (no contributor AND no job role). These are
                            // legacy records from old wizard code — equipment belongs in the
                            // Equipment card, not Crew.
                            const dayFilteredOps = scheduleActiveDayId
                                ? packageDayOperators.filter(o => o.event_day_template_id === scheduleActiveDayId)
                                : packageEventDays[0]
                                    ? packageDayOperators.filter(o => o.event_day_template_id === packageEventDays[0].id)
                                    : packageDayOperators;
                            const crewDayOps = dayFilteredOps.filter(o =>
                                // Keep operators that have a real contributor OR a real job role
                                // Exclude orphan placeholders (no contributor + no role) — these
                                // are equipment-only entries that should only appear in the
                                // Equipment card.
                                !!(o.contributor_id || o.job_role_id)
                            );
                            const crewActiveDay = packageEventDays.find(d => d.id === (scheduleActiveDayId || packageEventDays[0]?.id));
                            const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;

                            // ── Multi-activity crew assignments (DB-backed via activity_assignments) ──
                            // Returns true if the operator is explicitly assigned to the selected activity
                            const isCrewExplicitlyAssigned = (op: PackageDayOperatorRecord): boolean => {
                                if (!selectedActivityId) return false;
                                if (op.activity_assignments && op.activity_assignments.length > 0) {
                                    return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
                                }
                                // Legacy fallback: check single package_activity_id
                                if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
                                return false;
                            };
                            // Returns true for display purposes (day-level operators with no assignments appear for all)
                            const isCrewAssigned = (op: PackageDayOperatorRecord) => {
                                if (!selectedActivityId) return true; // No activity filter → all visible
                                if (isCrewExplicitlyAssigned(op)) return true;
                                // No assignments at all → day-level (show for all activities)
                                if (!op.activity_assignments || op.activity_assignments.length === 0) {
                                    if (!op.package_activity_id) return true;
                                }
                                return false;
                            };

                            // Toggle crew assignment for the selected activity (DB-backed)
                            const toggleCrewActivity = async (op: PackageDayOperatorRecord) => {
                                if (!selectedActivityId) return;
                                try {
                                    const explicitlyAssigned = isCrewExplicitlyAssigned(op);
                                    let updatedOp;
                                    if (explicitlyAssigned) {
                                        updatedOp = await api.operators.packageDay.unassignActivity(op.id, selectedActivityId);
                                    } else {
                                        updatedOp = await api.operators.packageDay.assignActivity(op.id, selectedActivityId);
                                    }
                                    // Update local state with the returned operator (includes activity_assignments)
                                    setPackageDayOperators(prev => prev.map(o => o.id === op.id ? { ...o, ...updatedOp } : o));
                                } catch (err) {
                                    console.warn('Failed to toggle crew activity:', err);
                                }
                            };

                            return (
                                <>
                                <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                                    {/* Card Header */}
                                    <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: crewDayOps.length > 0 ? '1px solid rgba(52, 58, 68, 0.25)' : 'none' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                                                    <PersonIcon sx={{ fontSize: 14, color: '#EC4899' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crew</Typography>
                                                    {selectedActivity ? (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600, mt: -0.25 }}>{selectedActivity.name}</Typography>
                                                    ) : crewActiveDay && packageEventDays.length > 1 ? (
                                                        <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600, mt: -0.25 }}>{crewActiveDay.name}</Typography>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                            {crewDayOps.length > 0 && (
                                                <Chip label={`${crewDayOps.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899', border: '1px solid rgba(236, 72, 153, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Crew listing — grouped by crew member */}
                                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                                        {(() => {
                                            // Build task-hours lookup from auto-generation preview
                                            const taskHoursMap = buildTaskHoursMap(taskPreview);

                                            // Group operators by contributor (unassigned slots go into their own group keyed by "unassigned-{id}")
                                            const grouped = new Map<string, { name: string; color: string; ops: typeof crewDayOps }>();
                                            for (const op of crewDayOps) {
                                                const key = op.contributor_id ? `c-${op.contributor_id}` : `unassigned-${op.id}`;
                                                const name = op.contributor
                                                    ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim() || 'Assigned'
                                                    : op.position_name || 'Unassigned';
                                                const color = op.contributor?.crew_color || op.position_color || '#EC4899';
                                                if (!grouped.has(key)) {
                                                    grouped.set(key, { name, color, ops: [] });
                                                }
                                                grouped.get(key)!.ops.push(op);
                                            }

                                            const groups = Array.from(grouped.entries());
                                            return groups.map(([key, group], gi) => {
                                                // Compute member subtotal using task hours for hourly roles, day rate for day-rate roles
                                                const memberTotal = group.ops.reduce((sum, op) => {
                                                    if (isCrewDayRate(op)) {
                                                        return sum + getCrewDayRate(op) * Number(op.hours || 1);
                                                    }
                                                    const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                                                    const taskKey = roleName ? `${group.name}|${roleName}` : null;
                                                    const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                                                    const rate = getCrewHourlyRate(op);
                                                    // Use task hours if available, otherwise fall back to operator hours
                                                    const hours = taskHours > 0 ? taskHours : Number(op.hours || 0);
                                                    return sum + rate * hours;
                                                }, 0);

                                                return (
                                                    <Box key={key} sx={{ mb: gi < groups.length - 1 ? 1.5 : 0 }}>
                                                        {/* Crew member header + subtotal */}
                                                        <Box 
                                                            onClick={() => {
                                                                // Get the contributor from the first operator in this group
                                                                const firstOp = group.ops[0];
                                                                if (firstOp?.contributor) {
                                                                    const dayId = scheduleActiveDayId || packageEventDays[0]?.id;
                                                                    const existingRoleIds = dayId
                                                                        ? packageDayOperators
                                                                            .filter(o => o.event_day_template_id === dayId && o.contributor_id === firstOp.contributor_id && o.job_role_id)
                                                                            .map(o => o.job_role_id!)
                                                                        : [];
                                                                    setRolePickerCrewMember(firstOp.contributor);
                                                                    setRolePickerSelectedIds(existingRoleIds);
                                                                    setRolePickerOpen(true);
                                                                }
                                                            }}
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, cursor: 'pointer', px: 1, mx: -1, borderRadius: 1.5, py: 0.25, transition: 'all 0.15s ease', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.08)' } }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: group.color }} />
                                                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 700, fontSize: '0.7rem', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {group.name}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 72, gap: 0.5, flexShrink: 0 }}>
                                                                <Typography variant="caption" sx={{
                                                                    color: memberTotal > 0 ? '#f59e0b' : '#475569',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.65rem',
                                                                    fontVariantNumeric: 'tabular-nums',
                                                                    textAlign: 'right',
                                                                }}>
                                                                    {memberTotal > 0 ? formatCurrency(memberTotal, currentBrand?.currency || 'USD') : '—'}
                                                                </Typography>
                                                                <Box sx={{ width: 19, flexShrink: 0 }} />
                                                            </Box>
                                                        </Box>

                                                        {/* Roles for this crew member */}
                                                        {group.ops.map((op) => {
                                                            const assigned = isCrewAssigned(op);
                                                            const dayRate = isCrewDayRate(op);
                                                            const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                                                            const taskKey = roleName ? `${group.name}|${roleName}` : null;
                                                            const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                                                            const rate = dayRate ? getCrewDayRate(op) : getCrewHourlyRate(op);
                                                            // For day-rate roles, cost = day_rate × days; for hourly use task hours (fallback to op.hours)
                                                            const hours = dayRate ? Number(op.hours || 1) : (taskHours > 0 ? taskHours : Number(op.hours || 0));
                                                            const cost = rate * hours;
                                                            return (
                                                                <Box
                                                                    key={op.id}
                                                                    onClick={() => {
                                                                        if (!selectedActivityId) return;
                                                                        toggleCrewActivity(op);
                                                                    }}
                                                                    sx={{
                                                                        display: 'flex', alignItems: 'center', gap: 1,
                                                                        py: 0.25, pl: 2.5, pr: 1, mx: -1, borderRadius: 1.5,
                                                                        transition: 'all 0.2s ease',
                                                                        opacity: assigned ? 1 : 0.3,
                                                                        cursor: selectedActivityId ? 'pointer' : 'default',
                                                                        '&:hover': {
                                                                            bgcolor: selectedActivityId ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.04)',
                                                                            opacity: selectedActivityId && !assigned ? 0.7 : (assigned ? 1 : 0.3),
                                                                            '& .op-del': { opacity: !selectedActivityId ? 1 : (assigned ? 1 : 0) },
                                                                        },
                                                                    }}
                                                                >
                                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, bgcolor: op.position_color || group.color, opacity: 0.5 }} />
                                                                    <Box
                                                                        sx={{ flex: 1, minWidth: 0, cursor: !selectedActivityId ? 'pointer' : undefined }}
                                                                        onClick={(e) => {
                                                                            if (selectedActivityId) return;
                                                                            e.stopPropagation();
                                                                            setCrewAssignAnchor(e.currentTarget as HTMLElement);
                                                                            setCrewAssignSlotId(op.id);
                                                                        }}
                                                                    >
                                                                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.6rem', color: '#94a3b8' }}>
                                                                            {(() => {
                                                                              let tierName: string | null = null;
                                                                              if (op?.contributor && op?.job_role) {
                                                                                const jobRoleMatch = op.contributor.contributor_job_roles?.find(
                                                                                  (cjr: any) => cjr.job_role_id === op.job_role_id
                                                                                );
                                                                                tierName = jobRoleMatch?.payment_bracket?.name || null;
                                                                              }
                                                                              
                                                                              return op.job_role 
                                                                                ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
                                                                                : (op.position_name || 'Crew');
                                                                            })()}
                                                                        </Typography>
                                                                    </Box>
                                                                    {/* Task hours badge — shows total hours from task auto-gen for this role */}
                                                                    {!dayRate && taskHours > 0 && (
                                                                        <Typography variant="caption" sx={{
                                                                            color: '#22d3ee',
                                                                            fontWeight: 700,
                                                                            fontSize: '0.5rem',
                                                                            fontVariantNumeric: 'tabular-nums',
                                                                            bgcolor: 'rgba(34, 211, 238, 0.1)',
                                                                            border: '1px solid rgba(34, 211, 238, 0.2)',
                                                                            borderRadius: 1,
                                                                            px: 0.5,
                                                                            py: 0.1,
                                                                            flexShrink: 0,
                                                                            lineHeight: 1.4,
                                                                        }}>
                                                                            {Math.round(taskHours * 10) / 10}h
                                                                        </Typography>
                                                                    )}
                                                                    {dayRate && (
                                                                        <Typography variant="caption" sx={{
                                                                            color: '#f59e0b',
                                                                            fontWeight: 600,
                                                                            fontSize: '0.5rem',
                                                                            fontVariantNumeric: 'tabular-nums',
                                                                            bgcolor: 'rgba(245, 158, 11, 0.08)',
                                                                            border: '1px solid rgba(245, 158, 11, 0.15)',
                                                                            borderRadius: 1,
                                                                            px: 0.5,
                                                                            py: 0.1,
                                                                            flexShrink: 0,
                                                                            lineHeight: 1.4,
                                                                        }}>
                                                                            Day
                                                                        </Typography>
                                                                    )}
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 72, gap: 0.5, flexShrink: 0 }}>
                                                                        <Typography variant="caption" sx={{
                                                                            color: cost > 0 ? 'rgba(245, 158, 11, 0.6)' : '#475569',
                                                                            fontWeight: 500,
                                                                            fontSize: '0.55rem',
                                                                            fontVariantNumeric: 'tabular-nums',
                                                                            textAlign: 'right',
                                                                        }}>
                                                                            {cost > 0 ? formatCurrency(cost, currentBrand?.currency || 'USD') : '—'}
                                                                        </Typography>
                                                                        <Box className="op-del" sx={{ opacity: 0, transition: 'opacity 0.15s', width: 19, flexShrink: 0 }}>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={async (e) => {
                                                                                    e.stopPropagation();
                                                                                    try {
                                                                                        await api.operators.packageDay.remove(op.id);
                                                                                        setPackageDayOperators(prev => prev.filter(o => o.id !== op.id));
                                                                                    } catch (err) {
                                                                                        console.warn('Failed to remove operator:', err);
                                                                                    }
                                                                                }}
                                                                                sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                                            >
                                                                                <DeleteIcon sx={{ fontSize: 11 }} />
                                                                            </IconButton>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                );
                                            });
                                        })()}

                                        {/* Crew Total */}
                                        {crewDayOps.length > 0 && (() => {
                                            const taskHoursMap = buildTaskHoursMap(taskPreview);
                                            const totalCrewCost = crewDayOps.reduce((sum, op) => {
                                                if (isCrewDayRate(op)) {
                                                    return sum + getCrewDayRate(op) * Number(op.hours || 1);
                                                }
                                                const crewName = op.contributor
                                                    ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                                                    : '';
                                                const roleName = op.job_role ? (op.job_role.display_name || op.job_role.name) : null;
                                                const taskKey = crewName && roleName ? `${crewName}|${roleName}` : null;
                                                const taskHours = taskKey ? (taskHoursMap.get(taskKey) || 0) : 0;
                                                const rate = getCrewHourlyRate(op);
                                                const hours = taskHours > 0 ? taskHours : Number(op.hours || 0);
                                                return sum + rate * hours;
                                            }, 0);
                                            return (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mt: 1.5,
                                                    pt: 1,
                                                    mx: -1,
                                                    px: 1,
                                                    borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                                                }}>
                                                    <Box sx={{ width: 8, flexShrink: 0 }} />
                                                    <Typography variant="caption" sx={{ flex: 1, color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', ml: 1 }}>
                                                        Total
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 72, gap: 0.5, flexShrink: 0 }}>
                                                        <Typography variant="caption" sx={{
                                                            color: totalCrewCost > 0 ? '#f59e0b' : '#475569',
                                                            fontWeight: 700,
                                                            fontSize: '0.7rem',
                                                            fontVariantNumeric: 'tabular-nums',
                                                            textAlign: 'right',
                                                        }}>
                                                            {totalCrewCost > 0 ? formatCurrency(totalCrewCost, currentBrand?.currency || 'USD') : '—'}
                                                        </Typography>
                                                        <Box sx={{ width: 19, flexShrink: 0 }} />
                                                    </Box>
                                                </Box>
                                            );
                                        })()}

                                        {/* Add Crew + Manage buttons */}
                                        <Box sx={{ mt: crewDayOps.length > 0 ? 1 : 0.5, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            {packageId && packageEventDays.length > 0 && (
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                                    onClick={(e) => {
                                                        setOperatorMenuAnchor(e.currentTarget);
                                                        setOperatorMenuDayId(scheduleActiveDayId || packageEventDays[0]?.id || null);
                                                    }}
                                                    sx={{ fontSize: '0.6rem', color: '#EC4899', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.06)' } }}
                                                >
                                                    Add Crew
                                                </Button>
                                            )}
                                            <Button
                                                size="small"
                                                href="/manager/equipment"
                                                component={Link}
                                                sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                                            >
                                                Manage
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Operator Add Menu — Role-based crew slot creation */}
                                <Menu
                                    anchorEl={operatorMenuAnchor}
                                    open={Boolean(operatorMenuAnchor)}
                                    onClose={() => { setOperatorMenuAnchor(null); setOperatorMenuDayId(null); }}
                                    PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 220, maxHeight: 420 } }}
                                >
                                    {/* Section: Add by Job Role (unassigned slot) */}
                                    <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                                        Add Role Slot
                                    </MenuItem>
                                    {jobRoles.length === 0 ? (
                                        <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No roles defined</MenuItem>
                                    ) : (
                                        jobRoles.map(role => (
                                            <MenuItem
                                                key={`role-${role.id}`}
                                                onClick={async () => {
                                                    setOperatorMenuAnchor(null);
                                                    if (!packageId || !operatorMenuDayId) return;
                                                    try {
                                                        // Build a unique position_name in case the same role added multiple times
                                                        const roleName = role.display_name || role.name;
                                                        const existingCount = packageDayOperators.filter(o =>
                                                            o.event_day_template_id === operatorMenuDayId &&
                                                            o.job_role_id === role.id
                                                        ).length;
                                                        const positionName = existingCount > 0 ? `${roleName} ${existingCount + 1}` : roleName;

                                                        const newOp = await api.operators.packageDay.add(packageId, {
                                                            event_day_template_id: operatorMenuDayId,
                                                            position_name: positionName,
                                                            contributor_id: null,
                                                            job_role_id: role.id,
                                                        });
                                                        if (selectedActivityId && newOp?.id) {
                                                            const assignedOp = await api.operators.packageDay.assignActivity(newOp.id, selectedActivityId);
                                                            setPackageDayOperators(prev => [...prev, { ...newOp, ...assignedOp }]);
                                                        } else {
                                                            setPackageDayOperators(prev => [...prev, newOp]);
                                                        }
                                                    } catch (err) {
                                                        console.warn('Failed to add role slot:', err);
                                                    }
                                                    setOperatorMenuDayId(null);
                                                }}
                                                sx={{ fontSize: '0.7rem', color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.1)' } }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EC4899', flexShrink: 0, opacity: 0.5 }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{role.display_name || role.name}</Typography>
                                                        {role.category && <Typography sx={{ fontSize: '0.5rem', color: '#64748b' }}>{role.category}</Typography>}
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))
                                    )}

                                    {/* Divider */}
                                    {crewMembers.length > 0 && (
                                        <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                                    )}

                                    {/* Section: Add specific crew member — opens role picker */}
                                    {crewMembers.length > 0 && (
                                        <>
                                            <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                                                Add Specific Person
                                            </MenuItem>
                                            {crewMembers.map(cm => {
                                                const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                                                const primaryRole = cm.contributor_job_roles.find(r => r.is_primary)?.job_role ||
                                                    cm.contributor_job_roles[0]?.job_role;
                                                // Show how many role slots this person already has on this day
                                                const slotsOnDay = operatorMenuDayId
                                                    ? packageDayOperators.filter(o =>
                                                        o.event_day_template_id === operatorMenuDayId && o.contributor_id === cm.id
                                                    ).length
                                                    : 0;
                                                return (
                                                    <MenuItem
                                                        key={`crew-${cm.id}`}
                                                        onClick={() => {
                                                            setOperatorMenuAnchor(null);
                                                            // Pre-select the roles this person already fills on this day
                                                            const existingRoleIds = operatorMenuDayId
                                                                ? packageDayOperators
                                                                    .filter(o => o.event_day_template_id === operatorMenuDayId && o.contributor_id === cm.id && o.job_role_id)
                                                                    .map(o => o.job_role_id!)
                                                                : [];
                                                            setRolePickerCrewMember(cm);
                                                            setRolePickerSelectedIds(existingRoleIds);
                                                            setRolePickerOpen(true);
                                                        }}
                                                        sx={{ fontSize: '0.7rem', color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.1)' } }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cm.crew_color || '#EC4899', flexShrink: 0 }} />
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{cmName}</Typography>
                                                                {primaryRole && <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>{primaryRole.display_name || primaryRole.name}</Typography>}
                                                            </Box>
                                                            {slotsOnDay > 0 && (
                                                                <Chip label={slotsOnDay} size="small" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', '& .MuiChip-label': { px: 0.5 } }} />
                                                            )}
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })
                                            }
                                        </>
                                    )}
                                </Menu>

                                {/* Crew Assignment Menu — assign/reassign a crew member to a role slot */}
                                <Menu
                                    anchorEl={crewAssignAnchor}
                                    open={Boolean(crewAssignAnchor)}
                                    onClose={() => { setCrewAssignAnchor(null); setCrewAssignSlotId(null); }}
                                    PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, maxHeight: 350 } }}
                                >
                                    {/* Unassign option */}
                                    {crewAssignSlotId && packageDayOperators.find(o => o.id === crewAssignSlotId)?.contributor_id && (
                                        <MenuItem
                                            onClick={async () => {
                                                if (!crewAssignSlotId) return;
                                                try {
                                                    await api.operators.packageDay.assign(crewAssignSlotId, null);
                                                    setPackageDayOperators(prev =>
                                                        prev.map(o => o.id === crewAssignSlotId ? { ...o, contributor_id: null, contributor: null } : o)
                                                    );
                                                } catch (err) {
                                                    console.warn('Failed to unassign crew:', err);
                                                }
                                                setCrewAssignAnchor(null);
                                                setCrewAssignSlotId(null);
                                            }}
                                            sx={{ fontSize: '0.7rem', color: '#f59e0b', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)' } }}
                                        >
                                            <RemoveIcon sx={{ fontSize: 14, mr: 1 }} /> Unassign
                                        </MenuItem>
                                    )}
                                    {crewAssignSlotId && packageDayOperators.find(o => o.id === crewAssignSlotId)?.contributor_id && (
                                        <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                                    )}
                                    {/* Crew member list — filtered by the slot's job role if set */}
                                    {(() => {
                                        const slot = crewAssignSlotId ? packageDayOperators.find(o => o.id === crewAssignSlotId) : null;
                                        const slotRoleId = slot?.job_role_id;

                                        // Separate crew into matching role vs others
                                        const matchingCrew = slotRoleId
                                            ? crewMembers.filter(cm => cm.contributor_job_roles.some(r => r.job_role.id === slotRoleId))
                                            : crewMembers;
                                        const otherCrew = slotRoleId
                                            ? crewMembers.filter(cm => !cm.contributor_job_roles.some(r => r.job_role.id === slotRoleId))
                                            : [];

                                        const renderCrewItem = (cm: CrewMemberOption) => {
                                            const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';
                                            const primaryRole = cm.contributor_job_roles.find(r => r.is_primary)?.job_role || cm.contributor_job_roles[0]?.job_role;
                                            const isCurrentlyAssigned = slot?.contributor_id === cm.id;
                                            return (
                                                <MenuItem
                                                    key={cm.id}
                                                    disabled={isCurrentlyAssigned}
                                                    onClick={async () => {
                                                        if (!crewAssignSlotId || isCurrentlyAssigned) return;
                                                        try {
                                                            const updated = await api.operators.packageDay.assign(crewAssignSlotId, cm.id);
                                                            setPackageDayOperators(prev =>
                                                                prev.map(o => o.id === crewAssignSlotId ? { ...o, ...updated } : o)
                                                            );
                                                        } catch (err) {
                                                            console.warn('Failed to assign crew:', err);
                                                        }
                                                        setCrewAssignAnchor(null);
                                                        setCrewAssignSlotId(null);
                                                    }}
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        color: isCurrentlyAssigned ? '#38bdf8' : '#e2e8f0',
                                                        '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' },
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cm.crew_color || '#EC4899', flexShrink: 0 }} />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{cmName}</Typography>
                                                            {primaryRole && <Typography sx={{ fontSize: '0.5rem', color: '#64748b' }}>{primaryRole.display_name || primaryRole.name}</Typography>}
                                                        </Box>
                                                        {isCurrentlyAssigned && <Typography sx={{ fontSize: '0.5rem', color: '#38bdf8' }}>✓</Typography>}
                                                    </Box>
                                                </MenuItem>
                                            );
                                        };

                                        return (
                                            <>
                                                {matchingCrew.length > 0 && slotRoleId && (
                                                    <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                                                        Matching Role
                                                    </MenuItem>
                                                )}
                                                {matchingCrew.map(renderCrewItem)}
                                                {otherCrew.length > 0 && (
                                                    <>
                                                        <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                                                        <MenuItem disabled sx={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.4, opacity: '1 !important' }}>
                                                            Other Crew
                                                        </MenuItem>
                                                        {otherCrew.map(renderCrewItem)}
                                                    </>
                                                )}
                                                {matchingCrew.length === 0 && otherCrew.length === 0 && (
                                                    <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No crew members available</MenuItem>
                                                )}
                                            </>
                                        );
                                    })()}
                                </Menu>

                                {/* Multi-Role Picker Dialog — select roles for a crew member */}
                                <Dialog
                                    open={rolePickerOpen}
                                    onClose={() => { setRolePickerOpen(false); setRolePickerCrewMember(null); setRolePickerSelectedIds([]); }}
                                    maxWidth="xs"
                                    fullWidth
                                    PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}
                                >
                                    {rolePickerCrewMember && (() => {
                                        const cmName = `${rolePickerCrewMember.contact.first_name || ''} ${rolePickerCrewMember.contact.last_name || ''}`.trim() || 'Unnamed';
                                        // Determine which role IDs are already saved as slots on this day (so we can distinguish new vs existing)
                                        const dayId = operatorMenuDayId || scheduleActiveDayId || packageEventDays[0]?.id;
                                        const existingSlotsForPerson = dayId
                                            ? packageDayOperators.filter(o => o.event_day_template_id === dayId && o.contributor_id === rolePickerCrewMember.id)
                                            : [];
                                        const existingRoleIdsOnDay = existingSlotsForPerson.filter(o => o.job_role_id).map(o => o.job_role_id!);

                                        return (
                                            <>
                                                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: rolePickerCrewMember.crew_color || '#EC4899', flexShrink: 0 }} />
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>Assign Roles — {cmName}</Typography>
                                                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', mt: -0.2 }}>Select which roles this person should fill on this day</Typography>
                                                    </Box>
                                                </DialogTitle>
                                                <DialogContent sx={{ pt: '8px !important', pb: 0 }}>
                                                    {jobRoles.length === 0 ? (
                                                        <Typography sx={{ color: '#475569', fontSize: '0.75rem', py: 2, textAlign: 'center' }}>No roles defined. Create roles in the Crew section first.</Typography>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            {jobRoles.map(role => {
                                                                const isChecked = rolePickerSelectedIds.includes(role.id);
                                                                const wasAlreadySaved = existingRoleIdsOnDay.includes(role.id);
                                                                // Does this person have this role in their profile?
                                                                const hasRoleInProfile = rolePickerCrewMember.contributor_job_roles.some(r => r.job_role.id === role.id);
                                                                return (
                                                                    <Box
                                                                        key={role.id}
                                                                        onClick={() => {
                                                                            setRolePickerSelectedIds(prev =>
                                                                                prev.includes(role.id)
                                                                                    ? prev.filter(id => id !== role.id)
                                                                                    : [...prev, role.id]
                                                                            );
                                                                        }}
                                                                        sx={{
                                                                            display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1.5, mx: -1.5,
                                                                            borderRadius: 1.5, cursor: 'pointer',
                                                                            bgcolor: isChecked ? 'rgba(236, 72, 153, 0.06)' : 'transparent',
                                                                            '&:hover': { bgcolor: isChecked ? 'rgba(236, 72, 153, 0.1)' : 'rgba(255,255,255,0.03)' },
                                                                            transition: 'all 0.15s ease',
                                                                        }}
                                                                    >
                                                                        <Checkbox
                                                                            checked={isChecked}
                                                                            size="small"
                                                                            sx={{
                                                                                p: 0, color: 'rgba(255,255,255,0.2)',
                                                                                '&.Mui-checked': { color: '#EC4899' },
                                                                            }}
                                                                        />
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isChecked ? '#f1f5f9' : '#94a3b8' }}>
                                                                                    {role.display_name || role.name}
                                                                                </Typography>
                                                                                {hasRoleInProfile && (
                                                                                    <Chip label="profile" size="small" sx={{ height: 14, fontSize: '0.45rem', fontWeight: 600, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', '& .MuiChip-label': { px: 0.4 } }} />
                                                                                )}
                                                                                {wasAlreadySaved && (
                                                                                    <Chip label="assigned" size="small" sx={{ height: 14, fontSize: '0.45rem', fontWeight: 600, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', '& .MuiChip-label': { px: 0.4 } }} />
                                                                                )}
                                                                            </Box>
                                                                            {role.category && (
                                                                                <Typography sx={{ fontSize: '0.55rem', color: '#475569', mt: -0.1 }}>{role.category}</Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                </DialogContent>
                                                <DialogActions sx={{ px: 3, py: 2 }}>
                                                    <Button
                                                        onClick={() => { setRolePickerOpen(false); setRolePickerCrewMember(null); setRolePickerSelectedIds([]); }}
                                                        sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'none' }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        disabled={rolePickerSelectedIds.length === 0 || rolePickerSaving}
                                                        onClick={async () => {
                                                            if (!packageId || !rolePickerCrewMember) return;
                                                            const dayId = operatorMenuDayId || scheduleActiveDayId || packageEventDays[0]?.id;
                                                            if (!dayId) return;
                                                            setRolePickerSaving(true);
                                                            try {
                                                                const cm = rolePickerCrewMember;
                                                                const cmName = `${cm.contact.first_name || ''} ${cm.contact.last_name || ''}`.trim() || 'Unnamed';

                                                                // Determine which roles to add and which to remove
                                                                const existingSlotsForPerson = packageDayOperators.filter(
                                                                    o => o.event_day_template_id === dayId && o.contributor_id === cm.id && o.job_role_id
                                                                );
                                                                const existingRoleIds = existingSlotsForPerson.map(o => o.job_role_id!);

                                                                // Roles to add (selected but not yet saved)
                                                                const rolesToAdd = rolePickerSelectedIds.filter(id => !existingRoleIds.includes(id));
                                                                // Roles to remove (were saved but now unchecked)
                                                                const slotsToRemove = existingSlotsForPerson.filter(o => !rolePickerSelectedIds.includes(o.job_role_id!));

                                                                // Remove unchecked role slots
                                                                for (const slot of slotsToRemove) {
                                                                    await api.operators.packageDay.remove(slot.id);
                                                                }

                                                                // Add new role slots
                                                                const newOps: PackageDayOperatorRecord[] = [];
                                                                for (const roleId of rolesToAdd) {
                                                                    const role = jobRoles.find(r => r.id === roleId);
                                                                    const roleName = role?.display_name || role?.name || 'Crew';
                                                                    // Build unique position_name
                                                                    const allExistingForRole = packageDayOperators.filter(
                                                                        o => o.event_day_template_id === dayId && o.job_role_id === roleId
                                                                    ).length;
                                                                    const positionName = allExistingForRole > 0 ? `${roleName} (${cmName})` : roleName;
                                                                    try {
                                                                        let newOp = await api.operators.packageDay.add(packageId, {
                                                                            event_day_template_id: dayId,
                                                                            position_name: positionName,
                                                                            position_color: cm.crew_color || null,
                                                                            contributor_id: cm.id,
                                                                            job_role_id: roleId,
                                                                        });
                                                                        if (selectedActivityId && newOp?.id) {
                                                                            const assignedOp = await api.operators.packageDay.assignActivity(newOp.id, selectedActivityId);
                                                                            newOp = { ...newOp, ...assignedOp };
                                                                        }
                                                                        newOps.push(newOp);
                                                                    } catch (err) {
                                                                        console.warn(`Failed to add role slot ${roleName}:`, err);
                                                                    }
                                                                }

                                                                // Update local state
                                                                setPackageDayOperators(prev => {
                                                                    const removeIds = new Set(slotsToRemove.map(s => s.id));
                                                                    return [...prev.filter(o => !removeIds.has(o.id)), ...newOps];
                                                                });
                                                            } catch (err) {
                                                                console.warn('Failed to save role assignments:', err);
                                                            } finally {
                                                                setRolePickerSaving(false);
                                                                setRolePickerOpen(false);
                                                                setRolePickerCrewMember(null);
                                                                setRolePickerSelectedIds([]);
                                                                setOperatorMenuDayId(null);
                                                            }
                                                        }}
                                                        sx={{
                                                            fontSize: '0.7rem', textTransform: 'none', fontWeight: 600,
                                                            bgcolor: '#EC4899', '&:hover': { bgcolor: '#db2777' },
                                                            '&.Mui-disabled': { bgcolor: 'rgba(236, 72, 153, 0.2)', color: 'rgba(255,255,255,0.25)' },
                                                        }}
                                                    >
                                                        {rolePickerSaving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : `Save (${rolePickerSelectedIds.length} role${rolePickerSelectedIds.length !== 1 ? 's' : ''})`}
                                                    </Button>
                                                </DialogActions>
                                            </>
                                        );
                                    })()}
                                </Dialog>
                                </>
                            );
                        })()}

                        {/* ── Equipment Card ── */}
                        {(() => {
                            // Equipment type alias
                            type EquipItem = { equipment_id: number; slot_type: 'CAMERA' | 'AUDIO'; track_number?: number; equipment?: { id: number; item_name: string; model?: string | null } };
                            type EquipmentContentsShape = {
                                items?: ServicePackageItem[];
                                day_equipment?: Record<string, EquipItem[]>;
                                activity_equipment?: Record<string, EquipItem[]>;
                            };

                            // ── Hierarchical equipment: Event Day (base) → Activity (override) ──
                            const equipmentContents = ((formData.contents || {}) as EquipmentContentsShape);
                            const dayEquipmentMap: Record<string, EquipItem[]> = equipmentContents.day_equipment || {};
                            const activityEquipmentOverrides: Record<string, EquipItem[]> = equipmentContents.activity_equipment || {};

                            const activeDayId: number | null = scheduleActiveDayId ?? packageEventDays[0]?.id ?? null;
                            const activePackageDay = activeDayId
                                ? packageEventDays.find((d: any) => d.id === activeDayId)
                                : packageEventDays[0];
                            const activeDayTemplateId = activePackageDay?.event_day_template_id || activePackageDay?.event_day?.id || null;

                            // Day equipment is the base/default level
                            const dayEquipment: EquipItem[] = activeDayId ? (dayEquipmentMap[String(activeDayId)] || []) : [];

                            // Fallback: derive equipment from relational operator-equipment links for the active day
                            const dayOpsForEquip = activeDayTemplateId
                                ? packageDayOperators.filter(o => o.event_day_template_id === activeDayTemplateId)
                                : packageDayOperators;
                            const relationalEquipment: EquipItem[] = dayOpsForEquip.flatMap((op) =>
                                (op.equipment || []).map((eq) => {
                                    const inferredType = eq.equipment?.category === 'AUDIO' ? 'AUDIO' : 'CAMERA';
                                    const parsedTrack = Number.parseInt(op.position_name.match(/\d+/)?.[0] || '', 10);
                                    return {
                                        equipment_id: eq.equipment_id,
                                        slot_type: inferredType,
                                        track_number: Number.isNaN(parsedTrack) ? undefined : parsedTrack,
                                        equipment: eq.equipment
                                            ? {
                                                id: eq.equipment.id,
                                                item_name: eq.equipment.item_name,
                                                model: eq.equipment.model,
                                            }
                                            : undefined,
                                    };
                                }),
                            );

                            const mergedDayEquipmentMap = new Map<number, EquipItem>();
                            dayEquipment.forEach((item) => mergedDayEquipmentMap.set(item.equipment_id, item));
                            relationalEquipment.forEach((item) => {
                                if (!mergedDayEquipmentMap.has(item.equipment_id)) {
                                    mergedDayEquipmentMap.set(item.equipment_id, item);
                                }
                            });
                            const mergedDayEquipment = Array.from(mergedDayEquipmentMap.values());

                            // Determine which level is active and resolve equipment
                            let equipmentItems: EquipItem[];
                            let activeLevel: 'day' | 'activity' = 'day';
                            let hasOverride = false;

                            if (selectedActivityId && activityEquipmentOverrides[String(selectedActivityId)]) {
                                equipmentItems = activityEquipmentOverrides[String(selectedActivityId)];
                                activeLevel = 'activity';
                                hasOverride = true;
                            } else {
                                equipmentItems = mergedDayEquipment;
                                activeLevel = 'day';
                            }

                            const cameraItems = equipmentItems.filter(e => e.slot_type === 'CAMERA').sort((a, b) => (a.track_number || 999) - (b.track_number || 999));
                            const audioItems = equipmentItems.filter(e => e.slot_type === 'AUDIO').sort((a, b) => (a.track_number || 999) - (b.track_number || 999));

                            // ── Save helpers that write to the correct level (auto-override when activity selected) ──
                            const saveEquipmentAtLevel = (newItems: EquipItem[]) => {
                                const contents: EquipmentContentsShape = { ...equipmentContents, items: equipmentContents.items || [] };
                                if (selectedActivityId) {
                                    // Auto-create/update activity override when activity is selected
                                    contents.activity_equipment = { ...activityEquipmentOverrides, [String(selectedActivityId)]: newItems };
                                } else if (activeDayId) {
                                    contents.day_equipment = { ...dayEquipmentMap, [String(activeDayId)]: newItems };
                                }
                                setFormData({ ...formData, contents });
                            };

                            const addEquipmentItem = (equipId: number, slotType: 'CAMERA' | 'AUDIO') => {
                                const eq = allEquipment.find((e: { id: number }) => e.id === equipId);
                                if (!eq) return;
                                const already = equipmentItems.some(e => e.equipment_id === equipId);
                                if (already) return;
                                // Auto-assign next available track number for this slot type
                                const usedTracks = equipmentItems.filter(e => e.slot_type === slotType).map(e => e.track_number || 0);
                                let nextTrack = 1;
                                while (usedTracks.includes(nextTrack)) nextTrack++;
                                saveEquipmentAtLevel([...equipmentItems, { equipment_id: equipId, slot_type: slotType, track_number: nextTrack, equipment: { id: eq.id, item_name: eq.item_name, model: eq.model } }]);
                            };

                            // Change track number — if the new number is already taken by another item of the same type, that item loses its track number
                            const changeTrackNumber = (equipmentId: number, slotType: 'CAMERA' | 'AUDIO', newTrack: number) => {
                                const updated = equipmentItems.map(item => {
                                    if (item.equipment_id === equipmentId) {
                                        return { ...item, track_number: newTrack };
                                    }
                                    // Remove track number from the other item that had this number (same slot type only)
                                    if (item.slot_type === slotType && item.track_number === newTrack) {
                                        return { ...item, track_number: undefined };
                                    }
                                    return item;
                                });
                                saveEquipmentAtLevel(updated);
                            };
                            const removeEquipmentItem = (equipId: number) => {
                                saveEquipmentAtLevel(equipmentItems.filter(e => e.equipment_id !== equipId));
                            };

                            // ── Override management (activity overrides day) ──
                            const resetOverride = () => {
                                if (!hasOverride || !selectedActivityId) return;
                                const contents: EquipmentContentsShape = { ...equipmentContents, items: equipmentContents.items || [] };
                                const updated = { ...activityEquipmentOverrides };
                                delete updated[String(selectedActivityId)];
                                contents.activity_equipment = updated;
                                setFormData({ ...formData, contents });
                            };
                            const levelLabel = activeLevel === 'activity' ? 'Activity Override' : 'Event Day';
                            const levelColor = activeLevel === 'activity' ? '#a855f7' : '#f59e0b';

                            // Build a map of equipment_id → operator for the active event day's operators
                            // Map: equipment_id -> operator record (use ALL day operators, not activity-filtered)
                            const equipToOperator = new Map<number, PackageDayOperatorRecord>();
                            dayOpsForEquip.forEach(op => {
                                (op.equipment || []).forEach(eq => {
                                    equipToOperator.set(eq.equipment_id, op);
                                });
                            });

                            // Helper to find operator assigned to a given equipment item
                            const getOperatorForEquipment = (equipmentId: number | undefined) => {
                                if (!equipmentId) return null;
                                return equipToOperator.get(equipmentId) || null;
                            };

                            // Helper: assign operator to equipment piece
                            const handleAssignOperator = async (operatorDayId: number, equipmentId: number) => {
                                const targetOp = dayOpsForEquip.find(o => o.id === operatorDayId);
                                if (!targetOp) return;
                                // Remove from any operator that currently owns this equipment
                                const currentOwner = equipToOperator.get(equipmentId);
                                if (currentOwner && currentOwner.id !== operatorDayId) {
                                    const updatedEquip = (currentOwner.equipment || [])
                                        .filter(e => e.equipment_id !== equipmentId)
                                        .map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }));
                                    try { await api.operators.packageDay.setEquipment(currentOwner.id, updatedEquip); } catch {}
                                }
                                // Add to the target operator
                                const existsAlready = (targetOp.equipment || []).some(e => e.equipment_id === equipmentId);
                                const newEquip = existsAlready
                                    ? (targetOp.equipment || []).map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }))
                                    : [...(targetOp.equipment || []).map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary })), { equipment_id: equipmentId, is_primary: true }];
                                try {
                                    await api.operators.packageDay.setEquipment(operatorDayId, newEquip);
                                    // Reload operators to reflect change
                                    if (packageId) {
                                        const dayOps = await api.operators.packageDay.getAll(packageId);
                                        setPackageDayOperators(dayOps || []);
                                    }
                                } catch (err) { console.warn('Failed to assign operator:', err); }
                            };

                            // Helper: unassign operator from equipment piece
                            const handleUnassignOperator = async (operatorDayId: number, equipmentId: number) => {
                                const targetOp = dayOpsForEquip.find(o => o.id === operatorDayId);
                                if (!targetOp) return;
                                const updatedEquip = (targetOp.equipment || [])
                                    .filter(e => e.equipment_id !== equipmentId)
                                    .map(e => ({ equipment_id: e.equipment_id, is_primary: e.is_primary }));
                                try {
                                    await api.operators.packageDay.setEquipment(operatorDayId, updatedEquip);
                                    if (packageId) {
                                        const dayOps = await api.operators.packageDay.getAll(packageId);
                                        setPackageDayOperators(dayOps || []);
                                    }
                                } catch (err) { console.warn('Failed to unassign operator:', err); }
                            };

                            // Helper: toggle unmanned status for equipment
                            const handleToggleUnmanned = async (equipmentId: number) => {
                                try {
                                    const isCurrentlyUnmanned = unmannedEquipment.some(eq => eq.id === equipmentId);
                                    await api.equipment.setUnmannedStatus(equipmentId, !isCurrentlyUnmanned);
                                    // Reload unmanned equipment list
                                    if (safeBrandId) {
                                        const unmannedList = await api.equipment.findUnmanned(safeBrandId);
                                        setUnmannedEquipment(unmannedList || []);
                                    }
                                    // Reload package day operators to refresh equipment data
                                    if (packageId) {
                                        const dayOps = await api.operators.packageDay.getAll(packageId);
                                        setPackageDayOperators(dayOps || []);
                                    }
                                } catch (err) {
                                    console.error('❌ Failed to toggle unmanned status:', err);
                                }
                            };

                            // Render a single equipment row with linked operator column
                            const renderEquipRow = (item: EquipItem, type: 'CAMERA' | 'AUDIO', fallbackIndex: number) => {
                                const isCamera = type === 'CAMERA';
                                const accentColor = isCamera ? '#648CFF' : '#10b981';
                                const hoverBg = isCamera ? 'rgba(100, 140, 255, 0.06)' : 'rgba(16, 185, 129, 0.06)';
                                const trackNum = item.track_number;
                                const trackLabel = trackNum ? (isCamera ? `Camera ${trackNum}` : `Audio ${trackNum}`) : (isCamera ? `Cam` : `Aud`);
                                const op = getOperatorForEquipment(item.equipment_id);
                                const opColor = op?.position_color || op?.contributor?.crew_color || '#EC4899';
                                
                                // Get tier name from contributor's job role assignments
                                let tierName: string | null = null;
                                if (op?.contributor && op?.job_role) {
                                  const jobRoleMatch = op.contributor.contributor_job_roles?.find(
                                    (cjr: any) => cjr.job_role_id === op.job_role_id
                                  );
                                  tierName = jobRoleMatch?.payment_bracket?.name || null;
                                }
                                
                                const opLabel = op?.job_role 
                                  ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
                                  : (op?.position_name || '');
                                const opInitials = opLabel ? opLabel.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';

                                // Equipment-level unmanned flag (per-camera, not per-operator)
                                const isEquipUnmanned = isCamera && unmannedEquipment.some(eq => eq.id === item.equipment_id);

                                // Fade equipment when an activity is selected — follows operator's DB-backed activity_assignments
                                const isEquipAssigned = (() => {
                                    if (!selectedActivityId) return true;
                                    if (!op) return true; // No operator linked → day-level, show for all
                                    if (op.activity_assignments && op.activity_assignments.length > 0) {
                                        return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
                                    }
                                    // Legacy fallback
                                    if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
                                    return true; // day-level operator → equipment shows for all
                                })();

                                return (
                                    <Box
                                        key={item.equipment_id}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 1,
                                            py: 0.75, px: 1.5, mx: -1.5,
                                            borderRadius: 1.5,
                                            opacity: isEquipAssigned ? 1 : 0.3,
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: hoverBg, '& .equip-del': { opacity: 1 } },
                                        }}
                                    >
                                        {/* Delete button */}
                                        <IconButton
                                            className="equip-del"
                                            size="small"
                                            onClick={() => removeEquipmentItem(item.equipment_id)}
                                            sx={{ p: 0, opacity: 0, transition: 'opacity 0.15s', color: 'rgba(255,255,255,0.25)', '&:hover': { color: '#ef4444' } }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 13 }} />
                                        </IconButton>
                                        {/* Track label — clickable to change track number */}
                                        <Box
                                            onClick={(e) => {
                                                setTrackPickerAnchor(e.currentTarget as HTMLElement);
                                                setTrackPickerTarget({ equipmentId: item.equipment_id, slotType: type });
                                            }}
                                            sx={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, flexShrink: 0,
                                                cursor: 'pointer', borderRadius: 1, py: 0.25, px: 0.25,
                                                transition: 'all 0.15s ease',
                                                '&:hover': { bgcolor: `${accentColor}12` },
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '0.45rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>Track</Typography>
                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: trackNum ? accentColor : '#475569', lineHeight: 1.3 }}>{trackLabel}</Typography>
                                        </Box>
                                        <Box sx={{
                                            width: 26, height: 26, borderRadius: 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: `${accentColor}18`,
                                            border: `1px solid ${accentColor}35`,
                                            flexShrink: 0,
                                        }}>
                                            {isCamera
                                                ? <VideocamIcon sx={{ fontSize: 13, color: accentColor }} />
                                                : <MicIcon sx={{ fontSize: 13, color: accentColor }} />
                                            }
                                        </Box>
                                        {/* Equipment name */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 600, fontSize: '0.73rem', color: '#f1f5f9',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {item.equipment?.item_name || `${isCamera ? 'Camera' : 'Audio'}`}
                                            </Typography>
                                            {item.equipment?.model && (
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', display: 'block', mt: -0.25 }}>
                                                    {item.equipment.model}
                                                </Typography>
                                            )}
                                        </Box>
                                        {/* Day rate cost column */}
                                        {(() => {
                                            const fullEq = allEquipment.find((e: any) => e.id === item.equipment_id);
                                            const dayRate = fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0;
                                            return (
                                                <Typography variant="caption" sx={{
                                                    color: dayRate > 0 ? '#f59e0b' : '#475569',
                                                    fontWeight: 600,
                                                    fontSize: '0.65rem',
                                                    minWidth: 56,
                                                    textAlign: 'right',
                                                    flexShrink: 0,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    {dayRate > 0 ? formatCurrency(dayRate, currentBrand?.currency || 'USD') : '—'}
                                                </Typography>
                                            );
                                        })()}
                                        {/* Operator column: UM toggle (equipment-level) + operator chip */}
                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                                            {/* UM toggle circle — marks THIS camera as unmanned/static */}
                                            {isCamera && (
                                                <Tooltip title={isEquipUnmanned ? 'Camera is unmanned (static) — click to remove' : 'Mark this camera as unmanned (static)'} arrow placement="top">
                                                    <Box
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleUnmanned(item.equipment_id);
                                                        }}
                                                        sx={{
                                                            width: 20, height: 20, borderRadius: '50%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer', flexShrink: 0,
                                                            border: isEquipUnmanned ? '2px solid #94a3b8' : '2px dashed rgba(100,116,139,0.35)',
                                                            bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.18)' : 'transparent',
                                                            transition: 'all 0.15s',
                                                            '&:hover': {
                                                                bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.28)' : 'rgba(148,163,184,0.08)',
                                                                borderColor: '#94a3b8',
                                                            },
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: '0.4rem', fontWeight: 800, color: isEquipUnmanned ? '#94a3b8' : 'rgba(100,116,139,0.5)', lineHeight: 1, userSelect: 'none' }}>
                                                            UM
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            )}
                                            {/* Operator chip or assign button */}
                                            {op ? (
                                                <Tooltip title={`${opLabel}${op.contributor ? ` · ${`${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()}` : ''}${isEquipUnmanned ? ' (Unmanned)' : ''} — Click to change`} arrow placement="top">
                                                    <Box
                                                        onClick={(e) => {
                                                            setEquipAssignAnchor(e.currentTarget);
                                                            setEquipAssignTarget({ equipmentId: item.equipment_id, currentOpId: op.id });
                                                        }}
                                                        sx={{
                                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                                            height: 24, pl: 0.25, pr: 1, borderRadius: 3,
                                                            bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.08)' : `${opColor}12`,
                                                            border: `1px solid ${isEquipUnmanned ? 'rgba(148,163,184,0.30)' : `${opColor}30`}`,
                                                            cursor: 'pointer', opacity: isEquipUnmanned ? 0.7 : 1,
                                                            transition: 'all 0.15s ease',
                                                            maxWidth: 120, flexShrink: 0,
                                                            '&:hover': { bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.18)' : `${opColor}22`, borderColor: isEquipUnmanned ? 'rgba(148,163,184,0.50)' : `${opColor}50` },
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            width: 18, height: 18, borderRadius: '50%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            bgcolor: isEquipUnmanned ? 'rgba(148,163,184,0.30)' : `${opColor}30`, flexShrink: 0,
                                                        }}>
                                                            <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: isEquipUnmanned ? '#94a3b8' : opColor, lineHeight: 1 }}>
                                                                {opInitials}
                                                            </Typography>
                                                        </Box>
                                                        <Typography sx={{
                                                            fontSize: '0.6rem', fontWeight: 700, color: isEquipUnmanned ? '#94a3b8' : opColor,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            lineHeight: 1,
                                                        }}>
                                                            {opLabel || 'Crew'}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            ) : (
                                                <Box
                                                    onClick={(e) => {
                                                        setEquipAssignAnchor(e.currentTarget);
                                                        setEquipAssignTarget({ equipmentId: item.equipment_id });
                                                    }}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', gap: 0.5,
                                                        height: 22, px: 0.75, borderRadius: 2,
                                                        border: '1px dashed rgba(100, 116, 139, 0.3)',
                                                        cursor: 'pointer', flexShrink: 0,
                                                        transition: 'all 0.15s ease',
                                                        '&:hover': { borderColor: 'rgba(100, 116, 139, 0.6)', bgcolor: 'rgba(255,255,255,0.03)' },
                                                    }}
                                                >
                                                    <AddIcon sx={{ fontSize: 10, color: '#475569' }} />
                                                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.55rem', fontWeight: 600 }}>
                                                        Assign Operator
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>
                                );
                            };

                            const activeDay = packageEventDays.find(d => d.id === (scheduleActiveDayId || packageEventDays[0]?.id));
                            const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;

                            return (
                                <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                                    {/* Card Header */}
                                    <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid rgba(52, 58, 68, 0.25)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                    <BuildIcon sx={{ fontSize: 14, color: '#10b981' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equipment</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -0.25 }}>
                                                        {selectedActivity ? (
                                                            <Typography sx={{ fontSize: '0.55rem', color: '#a855f7', fontWeight: 600 }}>{selectedActivity.name}</Typography>
                                                        ) : activeDay && packageEventDays.length > 1 ? (
                                                            <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontWeight: 600 }}>
                                                                {activeDay.name}
                                                            </Typography>
                                                        ) : null}
                                                        {/* Level badge */}
                                                        <Chip
                                                            label={levelLabel}
                                                            size="small"
                                                            sx={{
                                                                height: 14, fontSize: '0.45rem', fontWeight: 700,
                                                                bgcolor: `${levelColor}15`, color: levelColor,
                                                                border: `1px solid ${levelColor}30`,
                                                                '& .MuiChip-label': { px: 0.5 },
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Box>
                                            {(cameraItems.length > 0 || audioItems.length > 0) && (
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {cameraItems.length > 0 && (
                                                        <Chip
                                                            icon={<VideocamIcon sx={{ fontSize: '11px !important' }} />}
                                                            label={`${cameraItems.length}`}
                                                            size="small"
                                                            sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)', '& .MuiChip-icon': { color: '#648CFF' }, '& .MuiChip-label': { px: 0.4 } }}
                                                        />
                                                    )}
                                                    {audioItems.length > 0 && (
                                                        <Chip
                                                            icon={<MicIcon sx={{ fontSize: '11px !important' }} />}
                                                            label={`${audioItems.length}`}
                                                            size="small"
                                                            sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', '& .MuiChip-icon': { color: '#10b981' }, '& .MuiChip-label': { px: 0.4 } }}
                                                        />
                                                    )}
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Override controls bar — reset only (overrides auto-created on change) */}
                                        {hasOverride && (
                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Button
                                                    size="small"
                                                    onClick={resetOverride}
                                                    sx={{
                                                        fontSize: '0.5rem', textTransform: 'none', fontWeight: 600, py: 0.15, px: 0.75,
                                                        color: '#ef4444',
                                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.06)' },
                                                    }}
                                                >
                                                    Reset to Event Day
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* ── Equipment Section ── */}
                                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                                        {/* Section label + column header row */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem' }}>
                                                    Equipment
                                                </Typography>
                                            </Box>
                                            <Box sx={{ width: 120, textAlign: 'right' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem' }}>
                                                    Operator
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Camera rows */}
                                        {cameraItems.length > 0 && (
                                            <Box sx={{ mb: audioItems.length > 0 ? 1.5 : 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#648CFF' }} />
                                                    <Typography variant="caption" sx={{ color: '#648CFF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem', flex: 1 }}>
                                                        Cameras
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                                                        sx={{ p: 0.25, color: '#648CFF', opacity: 0.6, '&:hover': { opacity: 1, bgcolor: 'rgba(100, 140, 255, 0.08)' } }}
                                                    >
                                                        <AddIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                </Box>
                                                {cameraItems.map((item, idx) => renderEquipRow(item, 'CAMERA', idx + 1))}
                                            </Box>
                                        )}

                                        {/* Audio rows */}
                                        {audioItems.length > 0 && (
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#10b981' }} />
                                                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.5rem', flex: 1 }}>
                                                        Audio
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('AUDIO'); }}
                                                        sx={{ p: 0.25, color: '#10b981', opacity: 0.6, '&:hover': { opacity: 1, bgcolor: 'rgba(16, 185, 129, 0.08)' } }}
                                                    >
                                                        <AddIcon sx={{ fontSize: 12 }} />
                                                    </IconButton>
                                                </Box>
                                                {audioItems.map((item, idx) => renderEquipRow(item, 'AUDIO', idx + 1))}
                                            </Box>
                                        )}

                                        {equipmentItems.length === 0 && (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1 }}>
                                                    No equipment added yet
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                    <Button
                                                        size="small"
                                                        startIcon={<VideocamIcon sx={{ fontSize: 11 }} />}
                                                        onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                                                        sx={{ fontSize: '0.55rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                                                    >
                                                        Add Camera
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        startIcon={<MicIcon sx={{ fontSize: 11 }} />}
                                                        onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('AUDIO'); }}
                                                        sx={{ fontSize: '0.55rem', color: '#10b981', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.06)' } }}
                                                    >
                                                        Add Audio
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Equipment Total */}
                                        {equipmentItems.length > 0 && (() => {
                                            const totalEquipCost = equipmentItems.reduce((sum, item) => {
                                                const fullEq = allEquipment.find((e: any) => e.id === item.equipment_id);
                                                return sum + (fullEq?.rental_price_per_day ? Number(fullEq.rental_price_per_day) : 0);
                                            }, 0);
                                            return (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    mt: 1.5,
                                                    pt: 1,
                                                    borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                                                }}>
                                                    <Typography variant="caption" sx={{ flex: 1, color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                        Total
                                                    </Typography>
                                                    <Typography variant="caption" sx={{
                                                        color: totalEquipCost > 0 ? '#f59e0b' : '#475569',
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                        fontVariantNumeric: 'tabular-nums',
                                                        minWidth: 56,
                                                        textAlign: 'right',
                                                    }}>
                                                        {totalEquipCost > 0 ? formatCurrency(totalEquipCost, currentBrand?.currency || 'USD') : '—'}
                                                    </Typography>
                                                </Box>
                                            );
                                        })()}

                                        {/* Bottom actions */}
                                        <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Button
                                                size="small"
                                                startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                                onClick={(e) => { setAddEquipAnchor(e.currentTarget); setAddEquipType('CAMERA'); }}
                                                sx={{ fontSize: '0.6rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                                            >
                                                Add Equipment
                                            </Button>
                                            <Button
                                                size="small"
                                                href="/manager/equipment"
                                                component={Link}
                                                sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                                            >
                                                Manage Equipment
                                            </Button>
                                        </Box>
                                    </Box>

                                        {/* Equipment-Operator Assignment Menu */}
                                        <Menu
                                            anchorEl={equipAssignAnchor}
                                            open={Boolean(equipAssignAnchor)}
                                            onClose={() => { setEquipAssignAnchor(null); setEquipAssignTarget(null); }}
                                            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, maxHeight: 300 } }}
                                        >
                                            <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Assign Operator
                                                </Typography>
                                            </Box>
                                            {/* Mark Unmanned option (cameras only) */}
                                            {equipAssignTarget && (() => {
                                                const isCameraEquip = cameraItems.some(
                                                    (eq) => eq.equipment_id === equipAssignTarget.equipmentId
                                                );
                                                const isCurrentlyUnmanned = unmannedEquipment.some(eq => eq.id === equipAssignTarget.equipmentId);
                                                if (!isCameraEquip) return null;
                                                return (
                                                    <MenuItem
                                                        onClick={async () => {
                                                            setEquipAssignAnchor(null);
                                                            await handleToggleUnmanned(equipAssignTarget.equipmentId);
                                                            setEquipAssignTarget(null);
                                                        }}
                                                        sx={{
                                                            fontSize: '0.7rem', color: '#94a3b8', py: 0.75,
                                                            bgcolor: isCurrentlyUnmanned ? 'rgba(148, 163, 184, 0.12)' : 'transparent',
                                                            '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.18)' },
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                            <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(148, 163, 184, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: '#94a3b8' }}>UM</Typography>
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                                                    {isCurrentlyUnmanned ? 'Remove Unmanned' : 'Mark Unmanned'}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>No operator needed</Typography>
                                                            </Box>
                                                            {isCurrentlyUnmanned && (
                                                                <Typography sx={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: 600 }}>✓</Typography>
                                                            )}
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })()}
                                            {dayOpsForEquip.length === 0 ? (
                                                <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>Add crew members first</MenuItem>
                                            ) : (() => {
                                                // Determine required role based on equipment type
                                                const isTargetCamera = equipAssignTarget
                                                    ? cameraItems.some(eq => eq.equipment_id === equipAssignTarget.equipmentId)
                                                    : false;
                                                const isTargetAudio = equipAssignTarget
                                                    ? audioItems.some(eq => eq.equipment_id === equipAssignTarget.equipmentId)
                                                    : false;
                                                // Role name that matches equipment type
                                                const requiredRoleName = isTargetCamera ? 'videographer' : isTargetAudio ? 'sound_engineer' : null;
                                                const requiredRoleLabel = isTargetCamera ? 'Videographers' : isTargetAudio ? 'Sound Engineers' : null;

                                                // Split operators into matching-role and other
                                                const matchingOps = requiredRoleName
                                                    ? dayOpsForEquip.filter(op => op.job_role?.name === requiredRoleName)
                                                    : dayOpsForEquip;
                                                const otherOps = requiredRoleName
                                                    ? dayOpsForEquip.filter(op => op.job_role?.name !== requiredRoleName)
                                                    : [];

                                                const renderOpItem = (op: PackageDayOperatorRecord, dimmed = false) => {
                                                    const opC = op.position_color || op.contributor?.crew_color || '#EC4899';
                                                    
                                                    // Get tier name from contributor's job role assignments
                                                    let tierName: string | null = null;
                                                    if (op.contributor && op.job_role) {
                                                      const jobRoleMatch = op.contributor.contributor_job_roles?.find(
                                                        (cjr: any) => cjr.job_role_id === op.job_role_id
                                                      );
                                                      tierName = jobRoleMatch?.payment_bracket?.name || null;
                                                    }
                                                    
                                                    const opRoleLabel = op.job_role 
                                                      ? `${op.job_role.display_name || op.job_role.name}${tierName ? ` - ${tierName}` : ''}`
                                                      : (op.position_name || '?');
                                                    const initials = opRoleLabel.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                                                    const personName = op.contributor ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim() : null;
                                                    const isCurrentlyAssigned = equipAssignTarget?.currentOpId === op.id;
                                                    return (
                                                        <MenuItem
                                                            key={op.id}
                                                            onClick={async () => {
                                                                setEquipAssignAnchor(null);
                                                                if (!equipAssignTarget) return;
                                                                if (isCurrentlyAssigned) return;
                                                                await handleAssignOperator(op.id, equipAssignTarget.equipmentId);
                                                                setEquipAssignTarget(null);
                                                            }}
                                                            sx={{
                                                                fontSize: '0.7rem', color: dimmed ? '#64748b' : '#e2e8f0', py: 0.75,
                                                                opacity: dimmed ? 0.65 : 1,
                                                                bgcolor: isCurrentlyAssigned ? `${opC}12` : 'transparent',
                                                                '&:hover': { bgcolor: `${opC}18` },
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: `${opC}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: opC }}>{initials}</Typography>
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{opRoleLabel}</Typography>
                                                                    {personName && <Typography sx={{ fontSize: '0.55rem', color: '#38bdf8' }}>{personName}</Typography>}
                                                                    {!personName && <Typography sx={{ fontSize: '0.55rem', color: '#f59e0b', fontStyle: 'italic' }}>Unassigned</Typography>}
                                                                </Box>
                                                                {isCurrentlyAssigned && (
                                                                    <Typography sx={{ fontSize: '0.5rem', color: opC, fontWeight: 600 }}>✓</Typography>
                                                                )}
                                                            </Box>
                                                        </MenuItem>
                                                    );
                                                };

                                                return (
                                                    <>
                                                        {/* Matching role section */}
                                                        {requiredRoleLabel && (
                                                            <MenuItem disabled sx={{ fontSize: '0.5rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.3, minHeight: 0, opacity: '1 !important' }}>
                                                                {requiredRoleLabel}
                                                            </MenuItem>
                                                        )}
                                                        {matchingOps.length > 0
                                                            ? matchingOps.map(op => renderOpItem(op))
                                                            : requiredRoleName && (
                                                                <MenuItem disabled sx={{ fontSize: '0.65rem', color: '#475569', py: 0.5 }}>
                                                                    No {requiredRoleLabel?.toLowerCase()} on this day
                                                                </MenuItem>
                                                            )
                                                        }
                                                        {/* Other crew — shown dimmed as fallback */}
                                                        {otherOps.length > 0 && (
                                                            <>
                                                                <MenuItem disabled sx={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, py: 0.3, mt: 0.5, minHeight: 0, opacity: '1 !important', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                                    Other Crew
                                                                </MenuItem>
                                                                {otherOps.map(op => renderOpItem(op, true))}
                                                            </>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                            {/* Unassign option */}
                                            {equipAssignTarget?.currentOpId && (
                                                <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <MenuItem
                                                        onClick={async () => {
                                                            setEquipAssignAnchor(null);
                                                            if (!equipAssignTarget?.currentOpId) return;
                                                            await handleUnassignOperator(equipAssignTarget.currentOpId, equipAssignTarget.equipmentId);
                                                            setEquipAssignTarget(null);
                                                        }}
                                                        sx={{ fontSize: '0.7rem', color: '#ef4444', py: 0.75, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DeleteIcon sx={{ fontSize: 13, color: '#ef4444' }} />
                                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Unassign</Typography>
                                                        </Box>
                                                    </MenuItem>
                                                </Box>
                                            )}
                                        </Menu>

                                        {/* Add Equipment Menu */}
                                        <Menu
                                            anchorEl={addEquipAnchor}
                                            open={Boolean(addEquipAnchor)}
                                            onClose={() => setAddEquipAnchor(null)}
                                            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 220, maxHeight: 350 } }}
                                        >
                                            <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 0.5 }}>
                                                <Button
                                                    size="small"
                                                    onClick={() => setAddEquipType('CAMERA')}
                                                    sx={{
                                                        fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', minWidth: 0, px: 1, py: 0.25,
                                                        color: addEquipType === 'CAMERA' ? '#648CFF' : '#475569',
                                                        bgcolor: addEquipType === 'CAMERA' ? 'rgba(100, 140, 255, 0.1)' : 'transparent',
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    Cameras
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() => setAddEquipType('AUDIO')}
                                                    sx={{
                                                        fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', minWidth: 0, px: 1, py: 0.25,
                                                        color: addEquipType === 'AUDIO' ? '#10b981' : '#475569',
                                                        bgcolor: addEquipType === 'AUDIO' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    Audio
                                                </Button>
                                            </Box>
                                            {(() => {
                                                const typeColor = addEquipType === 'CAMERA' ? '#648CFF' : '#10b981';
                                                const categoryFilter = addEquipType === 'CAMERA' ? ['CAMERA'] : ['AUDIO'];
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const filtered = allEquipment.filter((eq: any) => categoryFilter.some(c => (eq.category || '').toUpperCase().includes(c)));
                                                // Exclude already-added equipment
                                                const existingIds = new Set(equipmentItems.map(e => e.equipment_id));
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const available = filtered.filter((eq: any) => !existingIds.has(eq.id));
                                                if (available.length === 0) {
                                                    return <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No {addEquipType.toLowerCase()} equipment available</MenuItem>;
                                                }
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                return available.map((eq: any) => (
                                                    <MenuItem
                                                        key={eq.id}
                                                        onClick={() => { addEquipmentItem(eq.id, addEquipType); setAddEquipAnchor(null); }}
                                                        sx={{ fontSize: '0.7rem', color: '#e2e8f0', py: 0.75, '&:hover': { bgcolor: `${typeColor}12` } }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                            <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                {addEquipType === 'CAMERA'
                                                                    ? <VideocamIcon sx={{ fontSize: 12, color: typeColor }} />
                                                                    : <MicIcon sx={{ fontSize: 12, color: typeColor }} />
                                                                }
                                                            </Box>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.item_name}</Typography>
                                                                {eq.model && <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>{eq.model}</Typography>}
                                                            </Box>
                                                        </Box>
                                                    </MenuItem>
                                                ));
                                            })()}
                                        </Menu>

                                        {/* Track Number Picker Menu */}
                                        <Menu
                                            anchorEl={trackPickerAnchor}
                                            open={Boolean(trackPickerAnchor)}
                                            onClose={() => { setTrackPickerAnchor(null); setTrackPickerTarget(null); }}
                                            PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 100 } }}
                                        >
                                            {(() => {
                                                if (!trackPickerTarget) return null;
                                                const { equipmentId, slotType } = trackPickerTarget;
                                                const isCamera = slotType === 'CAMERA';
                                                const accentColor = isCamera ? '#648CFF' : '#10b981';
                                                const sameTypeCount = equipmentItems.filter(e => e.slot_type === slotType).length;
                                                const maxTrack = Math.max(sameTypeCount, 4); // At least 4 options
                                                const currentItem = equipmentItems.find(e => e.equipment_id === equipmentId);
                                                const currentTrack = currentItem?.track_number;

                                                return (
                                                    <>
                                                        <Box sx={{ px: 1.5, py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                Set Track #
                                                            </Typography>
                                                        </Box>
                                                        {Array.from({ length: maxTrack }, (_, i) => i + 1).map(num => {
                                                            const takenBy = equipmentItems.find(e => e.slot_type === slotType && e.track_number === num && e.equipment_id !== equipmentId);
                                                            const isCurrent = currentTrack === num;
                                                            return (
                                                                <MenuItem
                                                                    key={num}
                                                                    onClick={() => {
                                                                        changeTrackNumber(equipmentId, slotType, num);
                                                                        setTrackPickerAnchor(null);
                                                                        setTrackPickerTarget(null);
                                                                    }}
                                                                    sx={{
                                                                        fontSize: '0.7rem', color: isCurrent ? accentColor : '#e2e8f0',
                                                                        py: 0.5, minHeight: 28,
                                                                        bgcolor: isCurrent ? `${accentColor}12` : 'transparent',
                                                                        '&:hover': { bgcolor: `${accentColor}18` },
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: isCurrent ? 800 : 600 }}>
                                                                            {isCamera ? 'Camera' : 'Audio'} {num}
                                                                        </Typography>
                                                                        {isCurrent && (
                                                                            <Typography sx={{ fontSize: '0.5rem', color: accentColor, fontWeight: 600 }}>✓</Typography>
                                                                        )}
                                                                        {takenBy && !isCurrent && (
                                                                            <Typography sx={{ fontSize: '0.45rem', color: '#64748b', fontStyle: 'italic' }}>swap</Typography>
                                                                        )}
                                                                    </Box>
                                                                </MenuItem>
                                                            );
                                                        })}
                                                    </>
                                                );
                                            })()}
                                        </Menu>

                                </Box>
                            );
                        })()}

                    </Stack>
                </Grid>
            </Grid>

            {/* ── Row 2: Package Contents ── */}
            <Grid container spacing={2.5} sx={{ mt: 0 }}>
                {/* ────── Column 1: Package Contents ────── */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ ...cardSx, overflow: 'hidden' }}>
                        {/* Card Header */}
                        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: (formData.contents?.items?.length ?? 0) > 0 ? '1px solid rgba(52, 58, 68, 0.25)' : 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(100, 140, 255, 0.1)', border: '1px solid rgba(100, 140, 255, 0.2)' }}>
                                        <VideoLibraryIcon sx={{ fontSize: 14, color: '#648CFF' }} />
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Package Contents</Typography>
                                </Box>
                                {(formData.contents?.items?.length ?? 0) > 0 && (
                                    <Chip label={`${formData.contents!.items.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', border: '1px solid rgba(100, 140, 255, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
                                )}
                            </Box>
                        </Box>

                        {/* Items listing */}
                        <Box>
                            {formData.contents?.items && formData.contents.items.length > 0 ? (
                                <>
                                    {/* ── Column header row ── */}
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center',
                                        px: 2.5, py: 0.75,
                                        borderBottom: '1px solid rgba(52,58,68,0.35)',
                                        bgcolor: 'rgba(255,255,255,0.015)',
                                    }}>
                                        {/* Type header */}
                                        <Typography sx={{ width: 54, flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Type</Typography>
                                        {/* Name */}
                                        <Typography sx={{ flex: '0 0 110px', fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Name</Typography>
                                        {/* Scenes */}
                                        <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Scenes</Typography>
                                        {/* Equip */}
                                        <Typography sx={{ width: 40, flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Equip</Typography>
                                        {/* Duration */}
                                        <Typography sx={{ width: 44, flexShrink: 0, fontSize: '0.58rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Dur.</Typography>
                                        {/* delete spacer */}
                                        <Box sx={{ width: 24, flexShrink: 0 }} />
                                    </Box>

                                    {formData.contents.items.map((item, idx) => {
                                        const film = item.type === 'film' ? films.find(f => f.id === item.referenceId) : null;
                                        const linkedActivity = item.config?.activity_id
                                            ? packageActivities.find((a: any) => a.id === item.config?.activity_id)
                                            : null;

                                        if (item.type === 'film' && film) {
                                            const stats = getFilmStats(item.referenceId || 0);

                                            return (
                                                <Box
                                                    key={item.id || idx}
                                                    onClick={() => handleConfigureItem(item)}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center',
                                                        pl: 1.5, pr: 2.5, py: 1.25, gap: 0,
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid rgba(52,58,68,0.22)',
                                                        borderLeft: '3px solid rgba(100,140,255,0.4)',
                                                        bgcolor: 'rgba(100,140,255,0.025)',
                                                        transition: 'background 0.15s ease, border-color 0.15s ease',
                                                        '&:last-of-type': { borderBottom: 'none' },
                                                        '&:hover': {
                                                            bgcolor: 'rgba(100,140,255,0.07)',
                                                            borderLeftColor: '#648CFF',
                                                            '& .cnt-del': { opacity: 1 },
                                                        },
                                                    }}
                                                >
                                                    {/* Type badge */}
                                                    <Box sx={{ width: 54, flexShrink: 0 }}>
                                                        <Box sx={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                                            px: 0.75, py: 0.2, borderRadius: 0.75,
                                                            bgcolor: 'rgba(100,140,255,0.12)',
                                                            border: '1px solid rgba(100,140,255,0.3)',
                                                        }}>
                                                            <VideoLibraryIcon sx={{ fontSize: 8, color: '#648CFF' }} />
                                                            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#648CFF', lineHeight: 1, letterSpacing: '0.2px' }}>Film</Typography>
                                                        </Box>
                                                    </Box>

                                                    {/* Film name */}
                                                    <Typography sx={{ flex: '0 0 110px', fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1.5 }}>
                                                        {item.description}
                                                    </Typography>

                                                    {/* Scenes column */}
                                                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.35, pr: 1 }}>
                                                        {film.scenes?.slice(0, 3).map((scene: { id: number; name: string; mode?: string }) => (
                                                            <Box key={scene.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {linkedActivity
                                                                    ? <Tooltip title={`Linked to: ${linkedActivity.name}`} placement="top">
                                                                        <LinkIcon sx={{ fontSize: 13, color: '#a855f7', flexShrink: 0 }} />
                                                                      </Tooltip>
                                                                    : <Box sx={{ width: 13, flexShrink: 0 }} />
                                                                }
                                                                <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                                    {scene.name}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                        {(film.scenes?.length || 0) > 3 && (
                                                            <Typography sx={{ fontSize: '0.55rem', color: '#475569', pl: 2.25 }}>+{film.scenes.length - 3} more</Typography>
                                                        )}
                                                    </Box>

                                                    {/* Equipment count */}
                                                    <Box sx={{ width: 40, flexShrink: 0, textAlign: 'right' }}>
                                                        {(() => {
                                                            const equipCount = film.scenes?.reduce((total: number, s: any) => total + (Array.isArray(s.equipment) ? s.equipment.length : 0), 0) ?? 0;
                                                            return equipCount > 0 ? (
                                                                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{equipCount}</Typography>
                                                            ) : (
                                                                <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>—</Typography>
                                                            );
                                                        })()}
                                                    </Box>

                                                    {/* Duration */}
                                                    <Box sx={{ width: 44, flexShrink: 0, textAlign: 'right' }}>
                                                        {stats.totalDuration !== '0:00' ? (
                                                            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                                {stats.totalDuration}
                                                            </Typography>
                                                        ) : (
                                                            <Typography sx={{ fontSize: '0.62rem', color: '#334155' }}>—</Typography>
                                                        )}
                                                    </Box>

                                                    {/* Delete */}
                                                    <Box className="cnt-del" sx={{ width: 24, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'flex-end' }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(idx); }}
                                                            sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 11 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            );
                                        }

                                        // Service item — compact row
                                        return (
                                            <Box
                                                key={item.id || idx}
                                                sx={{
                                                    display: 'flex', alignItems: 'center',
                                                    pl: 1.5, pr: 2.5, py: 1.25,
                                                    borderBottom: '1px solid rgba(52,58,68,0.22)',
                                                    borderLeft: '3px solid rgba(245,158,11,0.3)',
                                                    bgcolor: 'rgba(245,158,11,0.018)',
                                                    transition: 'background 0.15s ease, border-color 0.15s ease',
                                                    '&:last-of-type': { borderBottom: 'none' },
                                                    '&:hover': {
                                                        bgcolor: 'rgba(245,158,11,0.05)',
                                                        borderLeftColor: '#f59e0b',
                                                        '& .cnt-del': { opacity: 1 },
                                                    },
                                                }}
                                            >
                                                {/* Type badge */}
                                                <Box sx={{ width: 54, flexShrink: 0 }}>
                                                    <Box sx={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 0.4,
                                                        px: 0.75, py: 0.2, borderRadius: 0.75,
                                                        bgcolor: 'rgba(245,158,11,0.1)',
                                                        border: '1px solid rgba(245,158,11,0.25)',
                                                    }}>
                                                        <InventoryIcon sx={{ fontSize: 8, color: '#f59e0b' }} />
                                                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1, letterSpacing: '0.2px' }}>Service</Typography>
                                                    </Box>
                                                </Box>
                                                <Typography sx={{ flex: '0 0 110px', fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1.5 }}>
                                                    {item.description}
                                                </Typography>
                                                {/* Scenes — N/A for service */}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontStyle: 'italic' }}>—</Typography>
                                                </Box>
                                                {/* Equip — N/A for service */}
                                                <Box sx={{ width: 40, flexShrink: 0 }} />
                                                {/* Price in duration slot */}
                                                <Box sx={{ width: 44, flexShrink: 0, textAlign: 'right' }}>
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                        ${item.price.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                                <Box className="cnt-del" sx={{ width: 24, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ef4444' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 11 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </>
                            ) : (
                                <Typography sx={{ fontSize: '0.65rem', color: '#475569', py: 1.5, textAlign: 'center', fontStyle: 'italic', px: 2.5 }}>
                                    No items yet
                                </Typography>
                            )}

                            {/* Footer: Add Item button */}
                            <Box sx={{ mt: (formData.contents?.items?.length ?? 0) > 0 ? 1 : 0.5, display: 'flex', justifyContent: 'center', gap: 0.5, px: 2.5, pb: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                    onClick={() => { setNewItemType('film'); setAddDialogOpen(true); }}
                                    sx={{ fontSize: '0.6rem', color: '#648CFF', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(100, 140, 255, 0.06)' } }}
                                >
                                    Add Film
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                                    onClick={() => { setNewItemType('service'); setAddDialogOpen(true); }}
                                    sx={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'none', fontWeight: 600, py: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#94a3b8' } }}
                                >
                                    Add Service
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
                {/* ────── Column 2: Task Auto-Generation ────── */}
                <Grid item xs={12} md={6}>
                    {safeBrandId && packageId && (
                        <TaskAutoGenCard
                            packageId={packageId}
                            brandId={safeBrandId}
                            cardSx={cardSx}
                        />
                    )}
                </Grid>
            </Grid>

            {/* ─── Preview Modal ─── */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'rgba(16, 18, 22, 0.98)',
                        border: '1px solid rgba(52, 58, 68, 0.4)',
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }} component="div">
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Client Preview</Typography>
                        <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>How clients will see this package</Typography>
                    </Box>
                    <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: '#64748b' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {/* Package Header */}
                    <Box sx={{ mb: 3, pb: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#f1f5f9', mb: 0.5 }}>
                            {formData.name || 'Untitled Package'}
                        </Typography>
                        {formData.description && (
                            <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
                                {formData.description}
                            </Typography>
                        )}
                        {formData.category && (
                            <Chip
                                label={formData.category}
                                size="small"
                                sx={{ mt: 1, bgcolor: 'rgba(100, 140, 255, 0.1)', color: '#648CFF', fontWeight: 600, fontSize: '0.7rem', height: 24, border: '1px solid rgba(100, 140, 255, 0.25)' }}
                            />
                        )}
                    </Box>

                    {/* What's Included */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 2 }}>
                        What&apos;s Included
                    </Typography>
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                        {(formData.contents?.items || []).map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: 1.5,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: item.type === 'film' ? 'rgba(100, 140, 255, 0.1)' : 'rgba(255,255,255,0.06)',
                                }}>
                                    {item.type === 'film'
                                        ? <VideoLibraryIcon sx={{ fontSize: 16, color: '#648CFF' }} />
                                        : <InventoryIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                    }
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>
                                        {item.description}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                        {item.type === 'film' ? 'Film' : 'Service'}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                                    ${item.price?.toFixed(2) || '0.00'}
                                </Typography>
                            </Box>
                        ))}
                        {(!formData.contents?.items || formData.contents.items.length === 0) && (
                            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>No items in this package yet.</Typography>
                        )}
                    </Stack>

                    {/* Schedule Overview */}
                    {packageEventDays.length > 0 && (
                        <>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                                Schedule
                            </Typography>
                            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {packageEventDays.map((day) => (
                                    <Chip
                                        key={day.id}
                                        label={day.name}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 600, fontSize: '0.7rem', height: 26, border: '1px solid rgba(139, 92, 246, 0.25)' }}
                                    />
                                ))}
                            </Box>
                        </>
                    )}

                    {/* Total Pricing */}
                    <Box sx={{ mt: 2, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Package Total</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981' }}>
                            ${((formData.contents?.items || []).reduce((sum, item) => sum + (item.price || 0), 0) + Number(formData.base_price || 0)).toFixed(2)}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setPreviewOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ─── Version History Dialog ─── */}
            <Dialog
                open={versionHistoryOpen}
                onClose={() => setVersionHistoryOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'rgba(16, 18, 22, 0.98)',
                        border: '1px solid rgba(52, 58, 68, 0.4)',
                        borderRadius: 3,
                        backdropFilter: 'blur(20px)',
                        maxHeight: '80vh',
                    },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }} component="div">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HistoryIcon sx={{ fontSize: 20, color: '#8b5cf6' }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Version History</Typography>
                            <Typography variant="caption" component="span" sx={{ color: '#64748b', display: 'block' }}>{packageVersions.length} version{packageVersions.length !== 1 ? 's' : ''} saved</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setVersionHistoryOpen(false)} sx={{ color: '#64748b' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {versionsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
                        </Box>
                    ) : packageVersions.length > 0 ? (
                        <Stack spacing={1.5}>
                            {packageVersions.map((version, idx) => {
                                const snapshot = version.snapshot as Record<string, unknown> | null;
                                const versionDate = new Date(version.created_at);
                                const isLatest = idx === 0;
                                return (
                                    <Box
                                        key={version.id}
                                        sx={{
                                            p: 2, borderRadius: 2,
                                            bgcolor: isLatest ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isLatest ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': { border: '1px solid rgba(139, 92, 246, 0.3)', bgcolor: 'rgba(139, 92, 246, 0.04)' },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem' }}>
                                                        v{version.version_number}
                                                    </Typography>
                                                    {isLatest && (
                                                        <Chip label="Latest" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }} />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                                                    {versionDate.toLocaleDateString()} at {versionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                                {version.change_summary && (
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                        {version.change_summary}
                                                    </Typography>
                                                )}
                                                {snapshot && (
                                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        <Chip
                                                            label={String(snapshot.name || 'Untitled')}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                                                        />
                                                        {snapshot.base_price && (
                                                            <Chip
                                                                label={`$${Number(snapshot.base_price).toFixed(2)}`}
                                                                size="small"
                                                                sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                                            />
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                            {!isLatest && (
                                                <Tooltip title="Restore this version">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRestoreVersion(version.id)}
                                                        sx={{
                                                            color: '#8b5cf6',
                                                            bgcolor: 'rgba(139, 92, 246, 0.08)',
                                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                                            borderRadius: 1.5,
                                                            '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.15)' },
                                                        }}
                                                    >
                                                        <RestoreIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                No versions yet. Save the package to create the first version.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setVersionHistoryOpen(false)} sx={{ color: '#64748b', textTransform: 'none' }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Package Creation Wizard Modal */}
            <PackageCreationWizard
                open={packageCreationWizardOpen}
                onClose={() => setPackageCreationWizardOpen(false)}
                onPackageCreated={(newPackageId) => {
                    // Navigate to the new package details page
                    router.push(`/designer/packages/${newPackageId}`);
                }}
            />
        </Box>
    );
}
