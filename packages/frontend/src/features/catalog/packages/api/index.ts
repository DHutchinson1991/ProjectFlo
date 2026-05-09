import type { ApiClient } from '@/shared/api/client';
import {
    createPackageSetsApi,
    packageSetsApi,
    type PackageSetsApi,
} from './package-sets.api';
import {
    createServicePackagesApi,
    servicePackagesApi,
    type ServicePackagesApi,
} from './service-packages.api';

export function createPackagesApi(client: ApiClient) {
    return {
        servicePackages: createServicePackagesApi(client),
        packageSets: createPackageSetsApi(client),
    };
}

export * from '../types/api.types';
export * from './package-sets.api';
export * from './service-packages.api';

export const packagesApi = {
    servicePackages: servicePackagesApi,
    packageSets: packageSetsApi,
};

export type PackagesApi = typeof packagesApi;
export type { PackageSetsApi, ServicePackagesApi };
