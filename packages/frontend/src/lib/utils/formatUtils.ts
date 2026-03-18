/**
 * Formatting utility functions - app-wide utilities
 */

/**
 * Formats time in seconds to MM:SS format
 */
export const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formats duration in seconds to HH:MM:SS or MM:SS format
 */
export const formatDuration = (durationInSeconds: number): string => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Formats a number as a localized currency string.
 */
export const formatCurrency = (value: number | string, currency: string, locale = 'en-US'): string => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
        return '—';
    }
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(numeric);
};

/**
 * Returns the currency symbol for a given currency code (e.g. 'GBP' → '£', 'USD' → '$').
 */
export const getCurrencySymbol = (currency: string, locale = 'en-US'): string => {
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency })
            .formatToParts(0)
            .find(part => part.type === 'currency')?.value || currency;
    } catch {
        return currency;
    }
};
