'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { servicePackagesApi } from '@/features/catalog/packages/api';
import { createLinkedFilmFromTemplate, applyEquipmentTemplateToFilm } from '@/features/catalog/packages/utils/packageFilmLinker';
import { useBrand } from '@/features/platform/brand';
import { ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';

interface PackageFilmConfigScreenProps {
    packageId: number;
    itemId: string;
}

export function PackageFilmConfigScreen({ packageId, itemId }: PackageFilmConfigScreenProps) {
    const router = useRouter();
    const { currentBrand } = useBrand();
    const safeBrandId = currentBrand?.id || 1;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const linkAndRedirect = async () => {
            try {
                const pkg = await servicePackagesApi.getById(packageId);
                if (!pkg) throw new Error('Package not found');

                const item = pkg.contents?.items?.find((i: ServicePackageItem) => i.id === itemId);
                if (!item) throw new Error('Film item not found in package');

                if (item.config?.linked_film_id) {
                    await applyEquipmentTemplateToFilm(
                        item.config.linked_film_id,
                        safeBrandId,
                        pkg.contents?.equipment_template_id ?? null,
                        pkg.contents?.equipment_counts ?? null
                    );
                    router.replace(`/designer/films/${item.config.linked_film_id}?packageId=${packageId}&itemId=${itemId}`);
                    return;
                }

                if (!item.referenceId) {
                    throw new Error('Film template missing for this package item');
                }

                const newFilmId = await createLinkedFilmFromTemplate({
                    templateFilmId: item.referenceId,
                    brandId: safeBrandId,
                    packageName: pkg.name,
                    itemDescription: item.description,
                    subjectTemplateId: pkg.contents?.subject_template_id ?? null,
                    equipmentTemplateId: pkg.contents?.equipment_template_id ?? null,
                    equipmentCounts: pkg.contents?.equipment_counts ?? null,
                });

                const updatedItems = pkg.contents.items.map((existingItem: ServicePackageItem) =>
                    existingItem.id === itemId
                        ? {
                              ...existingItem,
                              config: {
                                  ...existingItem.config,
                                  linked_film_id: newFilmId,
                                  template_film_id: item.referenceId,
                              },
                          }
                        : existingItem
                );

                await servicePackagesApi.update(packageId, {
                    ...pkg,
                    contents: { items: updatedItems },
                });

                router.replace(`/designer/films/${newFilmId}?packageId=${packageId}&itemId=${itemId}`);
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'Failed to link film');
            } finally {
                setLoading(false);
            }
        };

        linkAndRedirect();
    }, [itemId, packageId, router, safeBrandId]);

    if (loading) {
        return (
            <Box p={5} display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={2}>
                <CircularProgress />
                <Typography color="text.secondary">Linking film to package...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return null;
}
