/**
 * Formatting utility functions
 */

/**
 * Formats time in seconds to MM:SS format
 */
export const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
