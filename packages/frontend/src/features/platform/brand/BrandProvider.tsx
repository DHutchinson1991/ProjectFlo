"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/platform/auth";
import { brandsApi } from "@/features/platform/brand/api";
import {
    Brand,
    BrandMember,
    BrandContextType,
} from "@/features/platform/brand/types";

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function useBrand() {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error("useBrand must be used within a BrandProvider");
    }
    return context;
}

interface BrandProviderProps {
    children: ReactNode;
}

const BRAND_STORAGE_KEY = "projectflo_current_brand";

function getStoredBrandId(): number | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
}

export function BrandProvider({ children }: BrandProviderProps) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Keep state null until brands load, while API header resolution can still use stored ID fallback.
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const brandRef = useRef<Brand | null>(null); // always mirrors currentBrand, readable synchronously

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track previous auth state so we only clear brand on a real logout
    // (was authenticated → became unauthenticated), NOT on initial mount
    const wasAuthenticated = useRef(false);

    // Keep ref in sync with state
    const updateBrand = useCallback((brand: Brand | null) => {
        brandRef.current = brand;
        setCurrentBrand(brand);
        if (brand) {
            localStorage.setItem(BRAND_STORAGE_KEY, brand.id.toString());
        }
    }, []);

    // Query for user's available brands
    const {
        data: BrandMembers = [],
        isLoading: brandsLoading,
        error: brandsError,
    } = useQuery<BrandMember[]>({
        queryKey: ["BrandMembers", user?.id],
        queryFn: () => brandsApi.getBrandMembers(user!.id),
        enabled: !!user?.id && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false, // prevent unnecessary refetches that trigger brand resolution
    });

    // Debug logging for user brands
    useEffect(() => {
        if (brandsError) {
            console.error('❌ Error loading user brands:', brandsError);
        }
    }, [brandsError]);

    // Memoize so a new array ref is only created when the underlying IDs change
    const availableBrands = useMemo(
        () => BrandMembers.map((ub) => ub.brand),
        [BrandMembers.map((ub) => ub.brand?.id).join(',')]
    );

    // Track whether we have already resolved the initial brand
    const brandResolved = useRef(false);

    // Load stored brand preference or set default — runs once when brands arrive
    useEffect(() => {
        if (!isAuthenticated || !user || availableBrands.length === 0) {
            return;
        }

        // If brand is already set AND still present in the list, sync the latest
        // data (e.g. updated tax rate) but don't change which brand is active.
        if (brandRef.current) {
            const refreshed = availableBrands.find((b) => b.id === brandRef.current!.id);
            if (refreshed) {
                updateBrand(refreshed);
                brandResolved.current = true;
                return;
            }
        }

        // Try stored preference
        const storedBrandId = localStorage.getItem(BRAND_STORAGE_KEY);
        if (storedBrandId) {
            const storedBrand = availableBrands.find(
                (brand) => brand.id === parseInt(storedBrandId, 10)
            );
            if (storedBrand) {
                updateBrand(storedBrand);
                brandResolved.current = true;
                return;
            }
        }

        // Fallback to first available
        updateBrand(availableBrands[0]);
        brandResolved.current = true;
    }, [isAuthenticated, user, availableBrands, updateBrand]);

    // Switch brand with hard refresh
    const switchBrand = useCallback(
        async (brandId: number) => {
            if (!user) {
                throw new Error("User must be authenticated to switch brands");
            }

            setIsLoading(true);
            setError(null);

            try {
                const targetBrand = availableBrands.find((brand) => brand.id === brandId);
                if (!targetBrand) {
                    throw new Error("Brand not found in user's available brands");
                }

                // Update state + ref + localStorage in one go
                updateBrand(targetBrand);

                // Invalidate brand-specific queries
                const brandSpecificPrefixes = [
                    "contacts",
                    "roles",
                    "scenes",
                    "films",
                    "projects",
                    "tasks",
                    "crew",
                ];

                for (const prefix of brandSpecificPrefixes) {
                    await queryClient.invalidateQueries({
                        queryKey: [prefix],
                        exact: false,
                    });
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to switch brand";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [user, availableBrands, queryClient, updateBrand]
    );

    // Refresh brands list
    const refreshBrands = useCallback(async () => {
        if (!user) return;

        await queryClient.invalidateQueries({ queryKey: ["BrandMembers", user.id] });
    }, [user, queryClient]);

    // Computed properties
    const isBrandSelected = currentBrand !== null;
    const getCurrentBrandId = useCallback(() => {
        return brandRef.current?.id || null;
    }, []); // stable — reads from ref

    // Clear brand state only on actual logout (was authenticated → became unauthenticated)
    // NOT on initial mount when isAuthenticated starts as false
    useEffect(() => {
        if (isAuthenticated) {
            wasAuthenticated.current = true;
        } else if (wasAuthenticated.current) {
            // This is a real logout transition
            wasAuthenticated.current = false;
            brandResolved.current = false;
            brandRef.current = null;
            setCurrentBrand(null);
            // Keep last selected brand so next login/session restores user preference.
        }
    }, [isAuthenticated]);

    const value: BrandContextType = {
        currentBrand,
        availableBrands,
        isLoading: isLoading || brandsLoading,
        error: error || (brandsError ? "Failed to load brands" : null),
        switchBrand,
        refreshBrands,
        isBrandSelected,
        getCurrentBrandId,
    };

    return (
        <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
    );
}
