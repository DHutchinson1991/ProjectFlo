export const catalogPackageKeys = {
    all: (brandId: number) => ['catalog', 'packages', brandId] as const,
    library: (brandId: number) => [...catalogPackageKeys.all(brandId), 'library'] as const,
    servicePackages: (brandId: number) => [...catalogPackageKeys.all(brandId), 'service-packages'] as const,
    servicePackageDetail: (brandId: number, packageId: number) =>
        [...catalogPackageKeys.servicePackages(brandId), 'detail', packageId] as const,
    packageAiRuns: (brandId: number, packageId: number) =>
        [...catalogPackageKeys.servicePackageDetail(brandId, packageId), 'ai-runs'] as const,
    packageAiRunDetail: (brandId: number, packageId: number, runId: string) =>
        [...catalogPackageKeys.packageAiRuns(brandId, packageId), runId] as const,
    packageSets: (brandId: number) => [...catalogPackageKeys.all(brandId), 'package-sets'] as const,
    packageSetDetail: (brandId: number, setId: number) =>
        [...catalogPackageKeys.packageSets(brandId), 'detail', setId] as const,
};