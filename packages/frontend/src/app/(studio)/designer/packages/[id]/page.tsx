'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, Grid, FormControl, 
    Select, MenuItem, Checkbox,
    IconButton, Breadcrumbs, Link, CircularProgress, Alert, Card,
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MovieIcon from '@mui/icons-material/Movie';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import BuildIcon from '@mui/icons-material/Build';
import PhotoFilterIcon from '@mui/icons-material/PhotoFilter';
import PlaceIcon from '@mui/icons-material/Place';

import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';

import { api } from '@/lib/api';
import { type EventDayTemplate } from '@/components/schedule';
import { createLinkedFilmFromTemplate } from '@/lib/utils/packageFilmLinker';
import { ServicePackage, ServicePackageItem } from '@/lib/types/domains/sales';
import { useBrand } from '@/app/providers/BrandProvider';
import { request } from '@/hooks/utils/api';
import { PackageScheduleCard } from '@/components/schedule/PackageScheduleCard';
import { ActivitiesCard } from '@/components/schedule/ActivitiesCard';
import { ActivityFilmWizard } from '@/components/schedule/ActivityFilmWizard';
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

interface OperatorTemplateRecord {
    id: number;
    name: string;
    role?: string | null;
    color?: string | null;
    order_index: number;
    default_equipment: Array<{
        id: number;
        equipment_id: number;
        is_primary: boolean;
        equipment?: { id: number; item_name: string; model?: string | null; category?: string };
    }>;
}

interface PackageDayOperatorRecord {
    id: number;
    package_id: number;
    event_day_template_id: number;
    operator_template_id: number;
    package_activity_id?: number | null;
    hours: number;
    notes?: string | null;
    order_index: number;
    operator_template: OperatorTemplateRecord;
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

    // Operator State
    const [operatorTemplates, setOperatorTemplates] = useState<OperatorTemplateRecord[]>([]);
    const [packageDayOperators, setPackageDayOperators] = useState<PackageDayOperatorRecord[]>([]);
    const [operatorMenuAnchor, setOperatorMenuAnchor] = useState<null | HTMLElement>(null);
    const [operatorMenuDayId, setOperatorMenuDayId] = useState<number | null>(null);

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

                // Load Operator Templates (brand-level)
                try {
                    const opTemplates = await api.operators.templates.getAll(safeBrandId);
                    setOperatorTemplates(opTemplates || []);
                } catch (otError) {
                    console.warn('Failed to load operator templates:', otError);
                }

                // Load Package Day Operators
                try {
                    const dayOps = await api.operators.packageDay.getAll(packageId);
                    setPackageDayOperators(dayOps || []);
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
            } else {
                // New Package Default
                setFormData({
                    name: 'New Package',
                    description: '',
                    category: '',
                    base_price: 0,
                    contents: { items: [] }
                });

                // Still load operator templates for new packages
                try {
                    const opTemplates = await api.operators.templates.getAll(safeBrandId);
                    setOperatorTemplates(opTemplates || []);
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

    // ─── Unmanned Cameras helper ────────────────────────────────────────
    const adjustUnmannedCameras = async (delta: number) => {
        const current = (formData.contents as any)?.unmanned_cameras || 0;
        const newCount = Math.max(0, current + delta);
        const updated = { ...formData, contents: { ...formData.contents, unmanned_cameras: newCount } };
        setFormData(updated);
        if (packageId && safeBrandId) {
            try {
                await api.servicePackages.update(safeBrandId, packageId, updated);
            } catch (err) {
                console.warn('Failed to save unmanned cameras count:', err);
            }
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
        setFormData({ ...formData, contents: { items } });
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
                router.push(`/designer/films/${linkedFilmId}?packageId=${savedPackageId}&itemId=${item.id}`);
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
                contents: { items: updatedItems },
            };

            await api.servicePackages.update(safeBrandId, savedPackageId, updatedPackage);
            setFormData(updatedPackage);

            router.push(`/designer/films/${newLinkedFilmId}?packageId=${savedPackageId}&itemId=${item.id}`);
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box
                                component="input"
                                value={formData.name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Package Name"
                                sx={{
                                    background: 'none', border: 'none', outline: 'none',
                                    fontWeight: 800, color: '#f1f5f9', fontSize: '1.8rem',
                                    fontFamily: 'inherit', lineHeight: 1.2,
                                    p: 0, m: 0, width: 'auto', minWidth: 120,
                                    flex: '0 1 auto',
                                    borderBottom: '2px solid transparent',
                                    transition: 'border-color 0.2s ease',
                                    '&:hover': { borderColor: 'rgba(255,255,255,0.08)' },
                                    '&:focus': { borderColor: '#648CFF' },
                                    '&::placeholder': { color: '#334155' },
                                }}
                            />
                            {/* Category — minimal inline select */}
                            <FormControl size="small" variant="standard" sx={{ minWidth: 0 }}>
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
                                display: 'block', width: '100%', maxWidth: 600,
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
                    <DialogTitle sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Add to Package</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Choose what to add to this package</Typography>
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
                                                <Chip label={`${daySlots.length}`} size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', '& .MuiChip-label': { px: 0.6 } }} />
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
                                            const assignedCount = slot.activity_assignments?.length || 0;
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
                            const crewDayOps = scheduleActiveDayId
                                ? packageDayOperators.filter(o => o.event_day_template_id === scheduleActiveDayId)
                                : packageEventDays[0]
                                    ? packageDayOperators.filter(o => o.event_day_template_id === packageEventDays[0].id)
                                    : packageDayOperators;
                            const crewActiveDay = packageEventDays.find(d => d.id === (scheduleActiveDayId || packageEventDays[0]?.id));
                            const selectedActivity = selectedActivityId ? packageActivities.find(a => a.id === selectedActivityId) : null;

                            // ── Multi-activity crew assignments (DB-backed via activity_assignments) ──
                            const isCrewAssigned = (op: PackageDayOperatorRecord) => {
                                if (!selectedActivityId) return true; // No activity filter → all visible
                                if (op.activity_assignments && op.activity_assignments.length > 0) {
                                    return op.activity_assignments.some(a => a.package_activity_id === selectedActivityId);
                                }
                                // Legacy fallback: check single package_activity_id
                                if (op.package_activity_id) return op.package_activity_id === selectedActivityId;
                                // No assignments at all → day-level (show for all activities)
                                return true;
                            };

                            // Toggle crew assignment for the selected activity (DB-backed)
                            const toggleCrewActivity = async (op: PackageDayOperatorRecord) => {
                                if (!selectedActivityId) return;
                                try {
                                    const assigned = isCrewAssigned(op);
                                    let updatedOp;
                                    if (assigned) {
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

                                    {/* Crew listing */}
                                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                                        {crewDayOps.map((op) => {
                                            const assigned = isCrewAssigned(op);
                                            return (
                                            <Box
                                                key={op.id}
                                                onClick={() => {
                                                    if (!selectedActivityId) return;
                                                    toggleCrewActivity(op);
                                                }}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1,
                                                    py: 0.5, px: 1, mx: -1, borderRadius: 1.5,
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
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: op.operator_template?.color || '#EC4899' }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {op.operator_template?.name || 'Operator'}
                                                    </Typography>
                                                    {op.operator_template?.role && (
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.55rem', display: 'block', mt: -0.2 }}>
                                                            {op.operator_template.role}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box className="op-del" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
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
                                            );
                                        })}

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

                                        {/* Unmanned Cameras counter */}
                                        <Box sx={{ mt: 1.5, mx: 1, display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 1, px: 1.25, py: 0.75 }}>
                                            <VideocamIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', flex: 1, fontStyle: 'italic' }}>
                                                Unmanned cameras
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => adjustUnmannedCameras(-1)}
                                                disabled={((formData.contents as any)?.unmanned_cameras || 0) <= 0}
                                                sx={{ p: 0.25, color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'white' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.1)' } }}
                                            >
                                                <RemoveIcon sx={{ fontSize: 12 }} />
                                            </IconButton>
                                            <Typography sx={{ fontSize: '0.7rem', color: 'white', minWidth: 16, textAlign: 'center', fontWeight: 700 }}>
                                                {(formData.contents as any)?.unmanned_cameras || 0}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => adjustUnmannedCameras(1)}
                                                sx={{ p: 0.25, color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'white' } }}
                                            >
                                                <AddIcon sx={{ fontSize: 12 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Operator Add Menu */}
                                <Menu
                                    anchorEl={operatorMenuAnchor}
                                    open={Boolean(operatorMenuAnchor)}
                                    onClose={() => { setOperatorMenuAnchor(null); setOperatorMenuDayId(null); }}
                                    PaperProps={{ sx: { bgcolor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', minWidth: 180 } }}
                                >
                                    {operatorTemplates.length === 0 ? (
                                        <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>No operator templates defined</MenuItem>
                                    ) : (
                                        operatorTemplates
                                            .filter(t => {
                                                if (!operatorMenuDayId) return true;
                                                // Day-level unique: exclude templates already on this day
                                                return !packageDayOperators.some(o =>
                                                    o.event_day_template_id === operatorMenuDayId &&
                                                    o.operator_template_id === t.id
                                                );
                                            })
                                            .map(t => (
                                                <MenuItem
                                                    key={t.id}
                                                    onClick={async () => {
                                                        setOperatorMenuAnchor(null);
                                                        if (!packageId || !operatorMenuDayId) return;
                                                        try {
                                                            // Create day-level record (no package_activity_id — multi-assign via junction table)
                                                            const newOp = await api.operators.packageDay.add(packageId, {
                                                                event_day_template_id: operatorMenuDayId,
                                                                operator_template_id: t.id,
                                                            });
                                                            // If an activity is selected, also assign to it via DB
                                                            if (selectedActivityId && newOp?.id) {
                                                                const assignedOp = await api.operators.packageDay.assignActivity(newOp.id, selectedActivityId);
                                                                setPackageDayOperators(prev => [...prev, { ...newOp, ...assignedOp }]);
                                                            } else {
                                                                setPackageDayOperators(prev => [...prev, newOp]);
                                                            }
                                                        } catch (err) {
                                                            console.warn('Failed to add operator:', err);
                                                        }
                                                        setOperatorMenuDayId(null);
                                                    }}
                                                    sx={{ fontSize: '0.7rem', color: '#e2e8f0', '&:hover': { bgcolor: 'rgba(236, 72, 153, 0.1)' } }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color || '#EC4899', flexShrink: 0 }} />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{t.name}</Typography>
                                                            {t.role && <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>{t.role}</Typography>}
                                                        </Box>
                                                    </Box>
                                                </MenuItem>
                                            ))
                                    )}
                                    {operatorTemplates.length > 0 && operatorMenuDayId && operatorTemplates.filter(t =>
                                        !packageDayOperators.some(o => o.event_day_template_id === operatorMenuDayId && o.operator_template_id === t.id)
                                    ).length === 0 && (
                                        <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>All operators assigned</MenuItem>
                                    )}
                                </Menu>
                                </>
                            );
                        })()}

                        {/* ── Equipment Card ── */}
                        {(() => {
                            // Equipment type alias
                            type EquipItem = { equipment_id: number; slot_type: 'CAMERA' | 'AUDIO'; track_number?: number; equipment?: { id: number; item_name: string; model?: string | null } };

                            // ── Hierarchical equipment: Event Day (base) → Activity (override) ──
                            const dayEquipmentMap: Record<string, EquipItem[]> = formData.contents?.day_equipment || {};
                            const activityEquipmentOverrides: Record<string, EquipItem[]> = formData.contents?.activity_equipment || {};

                            const activeDayId = scheduleActiveDayId || packageEventDays[0]?.id;

                            // Day equipment is the base/default level
                            const dayEquipment: EquipItem[] = activeDayId ? (dayEquipmentMap[String(activeDayId)] || []) : [];

                            // Determine which level is active and resolve equipment
                            let equipmentItems: EquipItem[];
                            let activeLevel: 'day' | 'activity' = 'day';
                            let hasOverride = false;

                            if (selectedActivityId && activityEquipmentOverrides[String(selectedActivityId)]) {
                                equipmentItems = activityEquipmentOverrides[String(selectedActivityId)];
                                activeLevel = 'activity';
                                hasOverride = true;
                            } else {
                                equipmentItems = dayEquipment;
                                activeLevel = 'day';
                            }

                            const cameraItems = equipmentItems.filter(e => e.slot_type === 'CAMERA').sort((a, b) => (a.track_number || 999) - (b.track_number || 999));
                            const audioItems = equipmentItems.filter(e => e.slot_type === 'AUDIO').sort((a, b) => (a.track_number || 999) - (b.track_number || 999));

                            // ── Save helpers that write to the correct level (auto-override when activity selected) ──
                            const saveEquipmentAtLevel = (newItems: EquipItem[]) => {
                                const contents = { ...formData.contents, items: formData.contents?.items || [] };
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
                                const contents = { ...formData.contents, items: formData.contents?.items || [] };
                                const updated = { ...activityEquipmentOverrides };
                                delete updated[String(selectedActivityId)];
                                contents.activity_equipment = updated;
                                setFormData({ ...formData, contents });
                            };
                            const levelLabel = activeLevel === 'activity' ? 'Activity Override' : 'Event Day';
                            const levelColor = activeLevel === 'activity' ? '#a855f7' : '#f59e0b';

                            // Build a map of equipment_id → operator for the active event day's operators
                            const dayOpsForEquip = scheduleActiveDayId
                                ? packageDayOperators.filter(o => o.event_day_template_id === scheduleActiveDayId)
                                : packageEventDays[0]
                                    ? packageDayOperators.filter(o => o.event_day_template_id === packageEventDays[0].id)
                                    : packageDayOperators;
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

                            // Render a single equipment row with linked operator column
                            const renderEquipRow = (item: EquipItem, type: 'CAMERA' | 'AUDIO', fallbackIndex: number) => {
                                const isCamera = type === 'CAMERA';
                                const accentColor = isCamera ? '#648CFF' : '#10b981';
                                const hoverBg = isCamera ? 'rgba(100, 140, 255, 0.06)' : 'rgba(16, 185, 129, 0.06)';
                                const trackNum = item.track_number;
                                const trackLabel = trackNum ? (isCamera ? `Camera ${trackNum}` : `Audio ${trackNum}`) : (isCamera ? `Cam` : `Aud`);
                                const op = getOperatorForEquipment(item.equipment_id);
                                const opColor = op?.operator_template?.color || '#EC4899';
                                const opInitials = op?.operator_template?.name ? op.operator_template.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';
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
                                        {/* Linked Operator — clickable to assign/change */}
                                        {op ? (
                                            <Tooltip title={`${op.operator_template?.name}${op.operator_template?.role ? ` · ${op.operator_template.role}` : ''} — Click to change`} arrow placement="top">
                                                <Box
                                                    onClick={(e) => {
                                                        setEquipAssignAnchor(e.currentTarget);
                                                        setEquipAssignTarget({ equipmentId: item.equipment_id, currentOpId: op.id });
                                                    }}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', gap: 0.5,
                                                        height: 24, pl: 0.25, pr: 1, borderRadius: 3,
                                                        bgcolor: `${opColor}12`,
                                                        border: `1px solid ${opColor}30`,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        maxWidth: 120, flexShrink: 0,
                                                        '&:hover': { bgcolor: `${opColor}22`, borderColor: `${opColor}50` },
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: 18, height: 18, borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        bgcolor: `${opColor}30`, flexShrink: 0,
                                                    }}>
                                                        <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: opColor, lineHeight: 1 }}>
                                                            {opInitials}
                                                        </Typography>
                                                    </Box>
                                                    <Typography sx={{
                                                        fontSize: '0.6rem', fontWeight: 700, color: opColor,
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        lineHeight: 1,
                                                    }}>
                                                        {op.operator_template?.name || 'Operator'}
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
                                            {dayOpsForEquip.length === 0 ? (
                                                <MenuItem disabled sx={{ fontSize: '0.7rem', color: '#475569' }}>Add crew members first</MenuItem>
                                            ) : (
                                                dayOpsForEquip.map(op => {
                                                    const opC = op.operator_template?.color || '#EC4899';
                                                    const initials = op.operator_template?.name ? op.operator_template.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
                                                    const isCurrentlyAssigned = equipAssignTarget?.currentOpId === op.id;
                                                    return (
                                                        <MenuItem
                                                            key={op.id}
                                                            onClick={async () => {
                                                                setEquipAssignAnchor(null);
                                                                if (!equipAssignTarget) return;
                                                                if (isCurrentlyAssigned) return; // Already assigned
                                                                await handleAssignOperator(op.id, equipAssignTarget.equipmentId);
                                                                setEquipAssignTarget(null);
                                                            }}
                                                            sx={{
                                                                fontSize: '0.7rem', color: '#e2e8f0', py: 0.75,
                                                                bgcolor: isCurrentlyAssigned ? `${opC}12` : 'transparent',
                                                                '&:hover': { bgcolor: `${opC}18` },
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                                                <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: `${opC}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: opC }}>{initials}</Typography>
                                                                </Box>
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{op.operator_template?.name}</Typography>
                                                                    {op.operator_template?.role && <Typography sx={{ fontSize: '0.55rem', color: '#64748b' }}>{op.operator_template.role}</Typography>}
                                                                </Box>
                                                                {isCurrentlyAssigned && (
                                                                    <Typography sx={{ fontSize: '0.5rem', color: opC, fontWeight: 600 }}>✓</Typography>
                                                                )}
                                                            </Box>
                                                        </MenuItem>
                                                    );
                                                })
                                            )}
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

                    {/* ── Package Contents Card ── */}
                    <Box sx={{ ...cardSx, borderColor: 'rgba(100, 140, 255, 0.15)', background: 'rgba(16, 18, 22, 0.85)' }}>
                        <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <VideoLibraryIcon sx={{ fontSize: 18, color: '#648CFF' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Package Contents</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                            Define what is included in this package. Click any item to configure it.
                        </Typography>

                        {/* List of Items - Modern Film Cards */}
                        {formData.contents?.items && formData.contents.items.length > 0 ? (
                            <Stack spacing={2.5} sx={{ mb: 4 }}>
                                {formData.contents.items.map((item, idx) => {
                                    const film = item.type === 'film' ? films.find(f => f.id === item.referenceId) : null;
                                    
                                    if (item.type === 'film' && film) {
                                        const stats = getFilmStats(item.referenceId || 0);
                                        
                                        return (
                                            <Card key={item.id || idx} onClick={() => handleConfigureItem(item)} sx={{
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                bgcolor: 'rgba(255, 255, 255, 0.02)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                '&:hover': {
                                                    border: '1px solid rgba(100, 140, 255, 0.25)',
                                                    bgcolor: 'rgba(255, 255, 255, 0.035)',
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                                }
                                            }}>
                                                {/* Top strip - accent line */}
                                                <Box sx={{
                                                    height: 3,
                                                    background: 'linear-gradient(90deg, #648CFF 0%, #A855F7 50%, #EC4899 100%)',
                                                }} />
                                                
                                                <Box sx={{ p: 2.5 }}>
                                                    {/* Single inline row: Icon · Title · Duration · Subjects · Price · Actions */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        {/* Film icon */}
                                                        <Box sx={{
                                                            width: 38, height: 38, borderRadius: 1.5,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: 'linear-gradient(135deg, #648CFF 0%, #5A7BF0 100%)',
                                                            flexShrink: 0,
                                                        }}>
                                                            <VideoLibraryIcon sx={{ fontSize: 20, color: 'white' }} />
                                                        </Box>

                                                        {/* Title */}
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.description}
                                                        </Typography>

                                                        {/* Inline stats */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexShrink: 0 }}>
                                                            {/* Duration */}
                                                            <Tooltip title="Duration">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <AccessTimeIcon sx={{ fontSize: 16, color: 'success.light', opacity: 0.7 }} />
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                                                                        {stats.totalDuration !== '0:00' ? stats.totalDuration : '—'}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>

                                                            {/* Subjects */}
                                                            <Tooltip title={film.subjects?.length > 0 ? film.subjects.map((s: { name: string }) => s.name).join(', ') : 'No subjects'}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <PeopleIcon sx={{ fontSize: 16, color: '#EC4899', opacity: 0.7 }} />
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                                                                        {film.subjects?.length || 0}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>

                                                            {/* Actions */}
                                                            <Tooltip title="Remove from package">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(idx); }}
                                                                    sx={{
                                                                        bgcolor: 'rgba(244, 67, 54, 0.08)',
                                                                        color: 'error.main',
                                                                        borderRadius: 1.5,
                                                                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' },
                                                                    }}
                                                                >
                                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>

                                                    {/* Scene Breakdown - mini list */}
                                                    {film.scenes && film.scenes.length > 0 && (
                                                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem', mb: 1, display: 'block' }}>
                                                                Scene Breakdown
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                {film.scenes.map((scene: { id: number; name: string; mode?: string }) => (
                                                                    <Box key={scene.id} sx={{
                                                                        display: 'flex', alignItems: 'center', gap: 0.75,
                                                                        px: 1.5, py: 0.75, borderRadius: 1.5,
                                                                        bgcolor: scene.mode === 'MONTAGE' 
                                                                            ? 'rgba(168, 85, 247, 0.08)' 
                                                                            : 'rgba(100, 140, 255, 0.08)',
                                                                        border: '1px solid',
                                                                        borderColor: scene.mode === 'MONTAGE' 
                                                                            ? 'rgba(168, 85, 247, 0.15)' 
                                                                            : 'rgba(100, 140, 255, 0.15)',
                                                                    }}>
                                                                        {scene.mode === 'MONTAGE' 
                                                                            ? <PhotoFilterIcon sx={{ fontSize: 13, color: '#A855F7', opacity: 0.7 }} />
                                                                            : <CameraAltIcon sx={{ fontSize: 13, color: '#648CFF', opacity: 0.7 }} />
                                                                        }
                                                                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.72rem', color: 'text.primary' }}>
                                                                            {scene.name}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                                                            {scene.mode === 'MONTAGE' ? 'Montage' : 'Realtime'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Card>
                                        );
                                    }
                                    
                                    // Service item - compact row
                                    return (
                                        <Card key={item.id || idx} sx={{
                                            borderRadius: 2,
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                bgcolor: 'rgba(255, 255, 255, 0.035)',
                                            }
                                        }}>
                                            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <Box sx={{
                                                        width: 40, height: 40, borderRadius: 1.5,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        bgcolor: 'rgba(255, 255, 255, 0.06)',
                                                        flexShrink: 0,
                                                    }}>
                                                        <InventoryIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {item.description}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Service Add-on
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'success.light' }}>
                                                        ${item.price.toFixed(2)}
                                                    </Typography>
                                                    <Tooltip title="Remove from package">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            sx={{
                                                                bgcolor: 'rgba(244, 67, 54, 0.08)',
                                                                color: 'error.main',
                                                                borderRadius: 1.5,
                                                                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Box sx={{
                                p: 5,
                                textAlign: 'center',
                                bgcolor: 'background.neutral',
                                borderRadius: 2,
                                border: '2px dashed',
                                borderColor: 'divider',
                                mb: 4
                            }}>
                                <MovieIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                                <Typography color="text.secondary" variant="body2">
                                    No items in package yet. Add films or services below.
                                </Typography>
                            </Box>
                        )}

                        {/* Add Item Button */}
                        <Box
                            onClick={() => { setNewItemType('film'); setAddDialogOpen(true); }}
                            sx={{
                                mt: 2, py: 2, px: 3,
                                borderRadius: 2,
                                border: '1px dashed rgba(100, 140, 255, 0.25)',
                                bgcolor: 'rgba(100, 140, 255, 0.04)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(100, 140, 255, 0.08)',
                                    border: '1px dashed rgba(100, 140, 255, 0.45)',
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 20, color: '#648CFF' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#648CFF', fontSize: '0.85rem' }}>
                                Add Item
                            </Typography>
                        </Box>
                        </Box>
                    </Box>
                    </Stack>
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
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Client Preview</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>How clients will see this package</Typography>
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
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HistoryIcon sx={{ fontSize: 20, color: '#8b5cf6' }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>Version History</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>{packageVersions.length} version{packageVersions.length !== 1 ? 's' : ''} saved</Typography>
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
        </Box>
    );
}
