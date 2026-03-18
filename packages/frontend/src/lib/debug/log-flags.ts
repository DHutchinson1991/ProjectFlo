/**
 * Debug Log Flags
 * Runtime toggles for noisy logs (dev only).
 */

type LogFlagKey = "film" | "moments";

type LogFlags = Partial<Record<LogFlagKey, boolean>>;

declare global {
    interface Window {
        __logs?: LogFlags;
        __logDebug?: {
            enable: (key: LogFlagKey) => void;
            disable: (key: LogFlagKey) => void;
            get: (key?: LogFlagKey) => LogFlags | boolean;
            list: () => LogFlags;
        };
    }
}

const isDev = process.env.NODE_ENV === "development";

const defaultFlags: LogFlags = {
    film: false,
    moments: true,
};

const ensureFlags = (): LogFlags => {
    if (typeof window === "undefined") return {};
    if (!window.__logs) window.__logs = {};
    return window.__logs;
};

export const isLogEnabled = (key: LogFlagKey): boolean => {
    if (!isDev || typeof window === "undefined") return false;
    const flags = ensureFlags();
    if (typeof flags[key] !== "undefined") return !!flags[key];
    return !!defaultFlags[key];
};

const enable = (key: LogFlagKey) => {
    if (!isDev || typeof window === "undefined") return;
    const flags = ensureFlags();
    flags[key] = true;
};

const disable = (key: LogFlagKey) => {
    if (!isDev || typeof window === "undefined") return;
    const flags = ensureFlags();
    flags[key] = false;
};

const get = (key?: LogFlagKey): LogFlags | boolean => {
    if (!isDev || typeof window === "undefined") return key ? false : {};
    const flags = ensureFlags();
    return key ? !!flags[key] : { ...flags };
};

const list = (): LogFlags => ({
    film: isLogEnabled("film"),
    moments: isLogEnabled("moments"),
});

if (typeof window !== "undefined" && isDev) {
    if (!window.__logDebug) {
        window.__logDebug = {
            enable,
            disable,
            get,
            list,
        };
    }
}
