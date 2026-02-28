"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { api, setBrandContextProvider } from "../../lib/api";
import {
    Brand,
    UserBrand,
    BrandContextType,
} from "../../lib/types";

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

export function BrandProvider({ children }: BrandProviderProps) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Query for user's available brands
    const {
        data: userBrands = [],
        isLoading: brandsLoading,
        error: brandsError,
    } = useQuery<UserBrand[]>({
        queryKey: ["userBrands", user?.id],
        queryFn: () => api.brands.getUserBrands(user!.id),
        enabled: !!user?.id && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Debug logging for user brands
    useEffect(() => {
        if (brandsError) {
            console.error('❌ Error loading user brands:', brandsError);
        }
    }, [userBrands, brandsError]);

    const availableBrands = userBrands.map((ub) => ub.brand);

    // Load stored brand preference or set default
    useEffect(() => {
        if (!isAuthenticated || !user || availableBrands.length === 0) {
            return;
        }

        // Check if we have a stored brand preference
        const storedBrandId = localStorage.getItem(BRAND_STORAGE_KEY);

        if (storedBrandId) {
            const storedBrand = availableBrands.find(
                (brand) => brand.id === parseInt(storedBrandId, 10)
            );

            if (storedBrand) {
                setCurrentBrand(storedBrand);
                // Force update the brand context provider immediately
                setBrandContextProvider({
                    getCurrentBrandId: () => storedBrand.id
                });
                return;
            }
        }

        // No valid stored brand, default to first available
        if (availableBrands.length > 0) {
            const defaultBrand = availableBrands[0];
            setCurrentBrand(defaultBrand);
            localStorage.setItem(BRAND_STORAGE_KEY, defaultBrand.id.toString());
            // Force update the brand context provider immediately
            setBrandContextProvider({
                getCurrentBrandId: () => defaultBrand.id
            });
        }
    }, [isAuthenticated, user, availableBrands]);

    // Switch brand with hard refresh
    const switchBrand = useCallback(
        async (brandId: number) => {
            if (!user) {
                throw new Error("User must be authenticated to switch brands");
            }

            setIsLoading(true);
            setError(null);

            try {
                // Find the brand in our available brands
                const targetBrand = availableBrands.find((brand) => brand.id === brandId);
                if (!targetBrand) {
                    throw new Error("Brand not found in user's available brands");
                }

                // Update local state directly (no backend call needed)
                console.log('🏢 BrandProvider Debug - Switching to brand:', targetBrand.name, 'ID:', brandId);
                setCurrentBrand(targetBrand);
                localStorage.setItem(BRAND_STORAGE_KEY, brandId.toString());

                // Force update the brand context provider immediately
                setBrandContextProvider({
                    getCurrentBrandId: () => {
                        console.log('🏢 BrandProvider Debug - Immediate getCurrentBrandId (switch) called, returning:', targetBrand.id, 'for brand:', targetBrand.name);
                        return targetBrand.id;
                    }
                });

                // Hard refresh of brand-specific data
                // Invalidate all brand-specific queries (both old and new brand contexts)
                const brandSpecificPrefixes = [
                    "contacts",
                    "roles",
                    "scenes",
                    "films",
                    "projects",
                    "tasks",
                    "contributors",
                ];

                console.log('🏢 BrandProvider Debug - Invalidating all brand-specific queries');

                // Invalidate all queries that start with these prefixes
                for (const prefix of brandSpecificPrefixes) {
                    await queryClient.invalidateQueries({
                        queryKey: [prefix],
                        exact: false // This will match ["contacts", 1], ["contacts", 2], etc.
                    });
                }

                // Note: We don't invalidate universal data like:
                // - components library
                // - timeline layers 
                // - global settings
                // These are shared across brands and don't need refresh

            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to switch brand";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [user, availableBrands, queryClient]
    );

    // Refresh brands list
    const refreshBrands = useCallback(async () => {
        if (!user) return;

        await queryClient.invalidateQueries({ queryKey: ["userBrands", user.id] });
    }, [user, queryClient]);

    // Computed properties
    const isBrandSelected = currentBrand !== null;
    const getCurrentBrandId = useCallback(() => {
        return currentBrand?.id || null;
    }, [currentBrand]);

    // Set up brand context provider for API service
    useEffect(() => {
        setBrandContextProvider({ getCurrentBrandId });
    }, [getCurrentBrandId, currentBrand]);

    // Clear brand state when user logs out
    useEffect(() => {
        if (!isAuthenticated) {
            setCurrentBrand(null);
            localStorage.removeItem(BRAND_STORAGE_KEY);
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
