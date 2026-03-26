'use client';

import { PackageFilmConfigScreen } from '@/features/catalog/packages';

export default function PackageFilmConfigPage({ params }: { params: { id: string; itemId: string } }) {
    return <PackageFilmConfigScreen packageId={Number(params.id)} itemId={params.itemId} />;
}
