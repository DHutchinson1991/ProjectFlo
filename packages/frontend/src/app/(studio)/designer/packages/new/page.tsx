'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PackageCreationWizard from '@/features/catalog/packages/components/creation/PackageCreationWizard';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';

function NewPackageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentBrand } = useBrand();
    const slotId = searchParams.get('slotId') ? parseInt(searchParams.get('slotId')!, 10) : null;

    return (
        <PackageCreationWizard
            fullPage
            onClose={() => router.push('/designer/packages')}
            onPackageCreated={async (packageId) => {
                // If a slotId was provided, assign the new package to that slot
                if (slotId && currentBrand?.id) {
                    try {
                        await api.packageSets.assignPackage(currentBrand.id, slotId, packageId);
                    } catch (err) {
                        console.warn('Failed to assign package to slot:', err);
                    }
                }
                router.push(`/designer/packages/${packageId}`);
            }}
        />
    );
}

export default function NewPackagePage() {
    return (
        <Suspense>
            <NewPackageContent />
        </Suspense>
    );
}
