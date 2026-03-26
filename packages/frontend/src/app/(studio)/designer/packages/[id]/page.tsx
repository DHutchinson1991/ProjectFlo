'use client';

import { PackageDetailScreen } from '@/features/catalog/packages/screens';

export default function PackageEditPage({ params }: { params: { id: string } }) {
    return <PackageDetailScreen packageIdParam={params.id} />;
}

