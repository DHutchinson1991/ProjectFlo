/**
 * Authentication Utilities for Development
 *
 * Provides convenient methods for debugging and working with authService
 * in development environments.
 */

import { authService } from './api';

/**
 * Log the current authentication state to the console
 * Useful for debugging authentication issues
 */
export function debugAuth() {
    const token = authService.getToken();

    console.group('🔐 Auth Debug Info');
    console.log('Token exists:', !!token);
    if (token) {
        // Don't log the full token for security, just a preview
        console.log('Token preview:', `${token.substring(0, 15)}...`);

        try {
            // Parse JWT payload (middle part of token)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Expires at:', new Date(payload.exp * 1000).toLocaleString());
            console.log('Issued at:', new Date(payload.iat * 1000).toLocaleString());
        } catch (e) {
            console.log('Error parsing token:', e);
        }
    }
    console.groupEnd();

    return { hasToken: !!token };
}

/**
 * Sets a development authentication token for testing
 * ONLY USE IN DEVELOPMENT!
 */
export function setDevAuthToken(token: string) {
    if (process.env.NODE_ENV !== 'development') {
        console.error('⚠️ setDevAuthToken should only be used in development!');
        return;
    }

    authService.setToken(token);
    console.log('✅ Development auth token set');

    // Return function to clear the token
    return () => {
        authService.setToken(null);
        console.log('✅ Development auth token cleared');
    };
}

/**
 * Clear the current authentication token
 * Useful for testing logout flows
 */
export function clearAuthToken() {
    authService.setToken(null);
    console.log('✅ Auth token cleared');
}

/**
 * Global window methods for quick debugging in browser console
 * Only added in development mode
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // @ts-expect-error - Adding to window object for debugging
    window.__auth = {
        debug: debugAuth,
        setToken: setDevAuthToken,
        clearToken: clearAuthToken,
        getToken: () => authService.getToken(),
    };

    console.log('🔐 Auth debugging utilities available at window.__auth');
    console.log('Try: window.__auth.debug()');
}
