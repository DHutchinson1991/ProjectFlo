import type { ApiClient } from '@/shared/api/client';
import {
    createPackageSetsApi,
    packageSetsApi,
    type PackageSetsApi,
} from './package-sets.api';
import {
    createServicePackageCategoriesApi,
    servicePackageCategoriesApi,
    type ServicePackageCategoriesApi,
} from './package-categories.api';
import {
    createServicePackagesApi,
    servicePackagesApi,
    type ServicePackagesApi,
} from './service-packages.api';

export function createPackagesApi(client: ApiClient) {
    return {
        servicePackages: createServicePackagesApi(client),
        servicePackageCategories: createServicePackageCategoriesApi(client),
        packageSets: createPackageSetsApi(client),
    };
}

export * from '../types/api.types';
export * from './package-categories.api';
export * from './package-sets.api';
export * from './service-packages.api';

export const packagesApi = {
    servicePackages: servicePackagesApi,
    servicePackageCategories: servicePackageCategoriesApi,
    packageSets: packageSetsApi,
};

export type PackagesApi = typeof packagesApi;
export type { PackageSetsApi, ServicePackageCategoriesApi, ServicePackagesApi };
