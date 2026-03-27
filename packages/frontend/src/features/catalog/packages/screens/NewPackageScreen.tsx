'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAssignPackageSetSlot } from '@/features/catalog/packages/hooks';
import PackageCreationWizard from '../components/creation/PackageCreationWizard';
import { useBrand } from '@/features/platform/brand';

function NewPackageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentBrand } = useBrand();
    const assignPackageMutation = useAssignPackageSetSlot(currentBrand?.id);
    const slotId = searchParams.get('slotId') ? parseInt(searchParams.get('slotId')!, 10) : null;

    return (
        <PackageCreationWizard
            fullPage
            onClose={() => router.push('/designer/packages')}
            onPackageCreated={async (packageId) => {
                if (slotId && currentBrand?.id) {
                    try {
                        await assignPackageMutation.mutateAsync({ slotId, servicePackageId: packageId });
                    } catch (err) {
                        console.warn('Failed to assign package to slot:', err);
                    }
                }
                router.push(`/designer/packages/${packageId}`);
            }}
        />
    );
}

export function NewPackageScreen() {
    return (
        <Suspense>
            <NewPackageContent />
        </Suspense>
    );
}
