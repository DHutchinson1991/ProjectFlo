// ─── Package Edit Page – Action Handlers Hook ──────────────────────
//
// Extracted from page.tsx (Phase 6).
// Owns isSaving state and all business-logic handlers so the page
// component stays focused on layout & orchestration.
// ────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { servicePackagesApi } from '@/features/catalog/packages/api';
import { scheduleApi } from '@/features/workflow/scheduling/package-template';
import { createLinkedFilmFromTemplate } from '@/features/catalog/packages/utils/packageFilmLinker';
import { ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';

import type { FilmData, PackageFilmRecord } from '../types';

// ─── Param type ──────────────────────────────────────────────────────

export interface UsePackageActionsParams {
    packageId: number | null;
    safeBrandId: number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    router: AppRouterInstance;
    films: FilmData[];
    setPackageFilms: React.Dispatch<React.SetStateAction<PackageFilmRecord[]>>;
    loadVersions: () => Promise<void>;
}

// ─── Return type (explicit for consumers) ────────────────────────────

export interface UsePackageActionsReturn {
    isSaving: boolean;
    handleSave: () => Promise<void>;
    handleRestoreVersion: (versionId: number) => Promise<void>;
    handleAddItem: (type: 'film' | 'service', filmId?: string, description?: string) => Promise<void>;
    handleRemoveItem: (index: number) => Promise<void>;
    handleConfigureItem: (item: ServicePackageItem) => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function usePackageActions({
    packageId,
    safeBrandId,
    formData,
    setFormData,
    router,
    films,
    setPackageFilms,
    loadVersions,
}: UsePackageActionsParams): UsePackageActionsReturn {
    const [isSaving, setIsSaving] = useState(false);

    // ── Save / Create ────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!formData.name) return alert('Name is required');
        if (!safeBrandId) return;
        const brandId = safeBrandId;
        setIsSaving(true);
        try {
            let savedPkgId = packageId;
            if (packageId) {
                await servicePackagesApi.update(packageId, formData);
            } else {
                const newPkg = await servicePackagesApi.create(formData);
                savedPkgId = newPkg.id;
                router.replace(`/packages/${newPkg.id}`);
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
                            const pf = await scheduleApi.packageFilms.create(savedPkgId, {
                                film_id: filmId,
                                order_index: i,
                            }) as PackageFilmRecord;
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
                    await servicePackagesApi.update(savedPkgId, updated);
                    setFormData(updated);
                }

                // Auto-create a version snapshot after successful save
                try {
                    await servicePackagesApi.versions.create(savedPkgId);
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
    }, [packageId, safeBrandId, formData, setFormData, router, setPackageFilms]);

    // ── Restore version ──────────────────────────────────────────────
    const handleRestoreVersion = useCallback(async (versionId: number) => {
        if (!packageId || !safeBrandId) return;
        const brandId = safeBrandId;
        try {
            const restored = await servicePackagesApi.versions.restore(packageId, versionId);
            setFormData(restored);
            await loadVersions();
        } catch (err) {
            console.error('Failed to restore version:', err);
            alert('Failed to restore version');
        }
    }, [packageId, safeBrandId, setFormData, loadVersions]);

    // ── Add item (film or service) ───────────────────────────────────
    const handleAddItem = useCallback(async (
        type: 'film' | 'service',
        filmId?: string,
        description?: string,
    ) => {
        const items = [...(formData.contents?.items || [])];

        if (type === 'film') {
            const film = films.find(f => f.id === Number(filmId));
            if (!film) return;

            const itemId = Math.random().toString(36).substr(2, 9);

            // Create PackageFilm record if package is already saved
            let packageFilmId: number | null = null;
            if (packageId) {
                try {
                    const pf = await scheduleApi.packageFilms.create(packageId, {
                        film_id: film.id,
                        order_index: items.filter(i => i.type === 'film').length,
                    }) as PackageFilmRecord;
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
                },
            });
        } else {
            if (!description) return;
            items.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'service',
                description,
                price: 0,
            });
        }

        setFormData({ ...formData, contents: { ...formData.contents, items } });
    }, [formData, films, packageId, setFormData, setPackageFilms]);

    // ── Remove item ──────────────────────────────────────────────────
    const handleRemoveItem = useCallback(async (index: number) => {
        const items = [...(formData.contents?.items || [])];
        const removedItem = items[index];

        // Delete the corresponding PackageFilm record if it exists
        if (removedItem?.config?.package_film_id) {
            try {
                await scheduleApi.packageFilms.delete(removedItem.config.package_film_id);
                setPackageFilms(prev => prev.filter(pf => pf.id !== removedItem.config?.package_film_id));
            } catch (pfErr) {
                console.warn('Failed to delete package film record:', pfErr);
            }
        }

        items.splice(index, 1);
        setFormData({ ...formData, contents: { ...formData.contents, items } });
    }, [formData, setFormData, setPackageFilms]);

    // ── Configure item (open film editor) ────────────────────────────
    const handleConfigureItem = useCallback(async (item: ServicePackageItem) => {
        if (!item.id) return;
        if (!safeBrandId) return;
        const brandId = safeBrandId;

        const ensurePackageSaved = async (): Promise<number> => {
            if (packageId) {
                await servicePackagesApi.update(packageId, formData);
                return packageId;
            }

            if (!confirm('You need to save the package before configuring items. Save now?')) {
                throw new Error('Package save cancelled');
            }

            const newPkg = await servicePackagesApi.create(formData);
            setFormData(newPkg);
            router.replace(`/packages/${newPkg.id}`);
            return newPkg.id;
        };

        setIsSaving(true);
        try {
            const savedPackageId = await ensurePackageSaved();

            const linkedFilmId = item.config?.linked_film_id;
            if (linkedFilmId) {
                const activityParam = item.config?.activity_id ? `&activityId=${item.config.activity_id}` : '';
                router.push(`/films/${linkedFilmId}?packageId=${savedPackageId}&itemId=${item.id}${activityParam}`);
                return;
            }

            if (!item.referenceId) {
                alert('No film template selected for this package item.');
                return;
            }

            const newLinkedFilmId = await createLinkedFilmFromTemplate({
                templateFilmId: item.referenceId,
                brandId,
                packageName: formData.name,
                itemDescription: item.description,
                subjectTemplateId: formData.contents?.subject_template_id ?? null,
            });

            // Create PackageFilm record for the new linked film
            let packageFilmId = item.config?.package_film_id ?? null;
            if (!packageFilmId) {
                try {
                    const pf = await scheduleApi.packageFilms.create(savedPackageId, {
                        film_id: newLinkedFilmId,
                        order_index: (formData.contents?.items || []).findIndex((i: ServicePackageItem) => i.id === item.id),
                    }) as PackageFilmRecord;
                    packageFilmId = pf.id;
                    setPackageFilms(prev => [...prev, pf]);
                } catch (pfErr) {
                    console.warn('Failed to create package film record:', pfErr);
                }
            }

            const updatedItems = (formData.contents?.items || []).map((existingItem: ServicePackageItem) =>
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
                    : existingItem,
            );

            const updatedPackage = {
                ...formData,
                contents: { ...formData.contents, items: updatedItems },
            };

            await servicePackagesApi.update(savedPackageId, updatedPackage);
            setFormData(updatedPackage);

            const activityParam2 = item.config?.activity_id ? `&activityId=${item.config.activity_id}` : '';
            router.push(`/films/${newLinkedFilmId}?packageId=${savedPackageId}&itemId=${item.id}${activityParam2}`);
        } catch (e) {
            if ((e as Error).message !== 'Package save cancelled') {
                console.error(e);
                alert('Failed to open film configuration');
            }
        } finally {
            setIsSaving(false);
        }
    }, [packageId, safeBrandId, formData, setFormData, router, setPackageFilms]);

    return {
        isSaving,
        handleSave,
        handleRestoreVersion,
        handleAddItem,
        handleRemoveItem,
        handleConfigureItem,
    };
}
