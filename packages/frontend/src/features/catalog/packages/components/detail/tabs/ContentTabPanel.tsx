'use client';

import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { DeliverablesCard } from '../cards';
import { tabPanelPadding } from '../detail-tokens';
import type { PackageActivityRecord, FilmData } from '../../../types';
import type { ServicePackageItem } from '../../../types/service-package.types';
import type { UsePlanningProgressReturn } from '../../../hooks/usePlanningProgress';

export interface ContentTabPanelProps {
    items: ServicePackageItem[];
    films: FilmData[];
    packageActivities: PackageActivityRecord[];
    onConfigureItem: (item: ServicePackageItem) => void;
    onSelectContentItem?: (item: ServicePackageItem, index: number) => void;
    selectedContentItemId?: string | null;
    onRemoveItem: (index: number) => void;
    onAddFilm: () => void;
    onAddService: () => void;
    cardSx: SxProps<Theme>;
    buildingFilmIds?: Set<number>;
    planning?: UsePlanningProgressReturn;
    filmCreationProgress?: { label: string; progress: number } | null;
}

export function ContentTabPanel({
    items, films, packageActivities,
    onConfigureItem, onSelectContentItem, selectedContentItemId,
    onRemoveItem, onAddFilm, onAddService, cardSx,
    buildingFilmIds,
    planning,
    filmCreationProgress,
}: ContentTabPanelProps) {
    return (
        <Box sx={tabPanelPadding}>
            <DeliverablesCard
                items={items} films={films}
                packageActivities={packageActivities}
                onConfigureItem={onConfigureItem}
                onSelectContentItem={onSelectContentItem}
                selectedContentItemId={selectedContentItemId}
                onRemoveItem={onRemoveItem}
                onAddFilm={onAddFilm} onAddService={onAddService}
                cardSx={cardSx}
                buildingFilmIds={buildingFilmIds}
                planning={planning}
                filmCreationProgress={filmCreationProgress}
            />
        </Box>
    );
}
