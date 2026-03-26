import { useEffect, useState } from 'react';
import { wizardStudioDataApi, inquiryWizardTemplatesApi } from '../api';
import type { InquiryWizardTemplate } from '../types';
import type { ServicePackage } from '@/lib/types';
import type { PackageSet } from '@/features/catalog/packages/types/package-set.types';
import type { EventType } from '@/features/catalog/event-types/types';
import type { WelcomeSettings } from '@/lib/types/brand';
import type { Contributor } from '@/lib/types/domains/users';
import { useBrand } from '@/app/providers/BrandProvider';

interface WizardStudioData {
    template: InquiryWizardTemplate | null;
    allPackages: ServicePackage[];
    packageSets: PackageSet[];
    eventTypes: EventType[];
    maxVideographers: number;
    maxCamerasPerOp: number;
    welcomeSettings: WelcomeSettings | null;
    loading: boolean;
    error: string | null;
}

export function useWizardStudioData(): WizardStudioData {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const [template, setTemplate] = useState<InquiryWizardTemplate | null>(null);
    const [allPackages, setAllPackages] = useState<ServicePackage[]>([]);
    const [packageSets, setPackageSets] = useState<PackageSet[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [maxVideographers, setMaxVideographers] = useState(1);
    const [maxCamerasPerOp, setMaxCamerasPerOp] = useState(3);
    const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!brandId) return;
        (async () => {
            try {
                setLoading(true);
                const [t, p, s, et, cr, camSetting, ws] = await Promise.all([
                    inquiryWizardTemplatesApi.getActive(),
                    wizardStudioDataApi.getServicePackages(),
                    wizardStudioDataApi.getPackageSets(),
                    wizardStudioDataApi.getEventTypes().catch(() => []),
                    wizardStudioDataApi.getCrew().catch(() => []),
                    wizardStudioDataApi.getBrandSetting('max_cameras_per_operator').catch(() => null),
                    wizardStudioDataApi.getWelcomeSettings().catch(() => null),
                ]);
                setTemplate(t);
                setAllPackages(p || []);
                setPackageSets(s || []);
                setEventTypes(et || []);
                const videographerCount = (cr || []).filter((c: Contributor) =>
                    (c.contributor_job_roles || []).some((cjr) =>
                        cjr.job_role?.name?.toLowerCase() === 'videographer'
                    )
                ).length;
                setMaxVideographers(Math.max(1, videographerCount));
                if (camSetting?.value) setMaxCamerasPerOp(Math.max(1, parseInt(camSetting.value, 10) || 3));
                if (ws) setWelcomeSettings(ws);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unable to load. Please try again.';
                console.error('❌ Wizard Load Error:', msg, err);
                setError(msg);
            } finally {
                setLoading(false);
            }
        })();
    }, [brandId]);

    return { template, allPackages, packageSets, eventTypes, maxVideographers, maxCamerasPerOp, welcomeSettings, loading, error };
}
