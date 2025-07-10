/**
 * User API Mappers
 * 
 * Functions to transform backend API responses into frontend domain models.
 * This abstraction allows us to evolve frontend models independently of backend changes.
 */

import {
    ContributorApiResponse,
    ContactApiResponse,
    RoleApiResponse
} from "../api/users";

import {
    Contributor,
    Contact,
    Role
} from "../domains/users";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely converts a nullable string to undefined
 */
function nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
}

/**
 * Converts backend decimal string to number
 */
function parseDecimalToNumber(value: string | number | undefined): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    return 0;
}

/**
 * Generates user initials from first and last name
 */
function generateInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "U";
}

/**
 * Generates full name from first and last name
 */
function generateFullName(firstName?: string, lastName?: string, email?: string): string {
    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email || "Unknown User";
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Maps backend Role API response to frontend Role domain model
 */
export function mapRoleResponse(apiResponse: RoleApiResponse): Role {
    return {
        id: apiResponse.id,
        name: apiResponse.name,
        description: apiResponse.description,
        brand_id: apiResponse.brand_id,
    };
}

/**
 * Maps backend Contact API response to frontend Contact domain model
 */
export function mapContactResponse(apiResponse: ContactApiResponse): Contact {
    return {
        id: apiResponse.id,
        email: apiResponse.email,
        first_name: nullToUndefined(apiResponse.first_name),
        last_name: nullToUndefined(apiResponse.last_name),
        phone_number: nullToUndefined(apiResponse.phone_number),
        company_name: nullToUndefined(apiResponse.company_name),
        type: apiResponse.type,
        brand_id: nullToUndefined(apiResponse.brand_id),
        archived_at: apiResponse.archived_at,
    };
}

/**
 * Maps backend Contributor API response to frontend Contributor domain model
 */
export function mapContributorResponse(apiResponse: ContributorApiResponse): Contributor {
    const contact = mapContactResponse(apiResponse.contact);
    const role = mapRoleResponse(apiResponse.role);

    return {
        // Core contributor data
        id: apiResponse.id,
        contact_id: apiResponse.contact_id,
        role_id: apiResponse.role_id,
        contributor_type: apiResponse.contributor_type,
        default_hourly_rate: parseDecimalToNumber(apiResponse.default_hourly_rate),
        archived_at: apiResponse.archived_at,

        // Related entities
        contact,
        role,

        // Computed convenience properties
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: generateFullName(contact.first_name, contact.last_name, contact.email),
        initials: generateInitials(contact.first_name, contact.last_name),
    };
}

// ============================================================================
// COLLECTION MAPPERS
// ============================================================================

/**
 * Maps an array of contributor API responses to domain models
 */
export function mapContributorsListResponse(apiResponses: ContributorApiResponse[]): Contributor[] {
    return apiResponses.map(mapContributorResponse);
}

/**
 * Maps an array of contact API responses to domain models
 */
export function mapContactsListResponse(apiResponses: ContactApiResponse[]): Contact[] {
    return apiResponses.map(mapContactResponse);
}

/**
 * Maps an array of role API responses to domain models
 */
export function mapRolesListResponse(apiResponses: RoleApiResponse[]): Role[] {
    return apiResponses.map(mapRoleResponse);
}

// ============================================================================
// HELPER FUNCTIONS FOR UI
// ============================================================================

/**
 * Helper to get user initials for display (fallback-safe)
 */
export function getUserInitials(user: Contributor | Contact | { first_name?: string; last_name?: string }): string {
    if ('initials' in user) {
        return user.initials;
    }
    return generateInitials(user.first_name, user.last_name);
}

/**
 * Helper to get user display name (fallback-safe)
 */
export function getUserDisplayName(user: Contributor | Contact | { first_name?: string; last_name?: string; email?: string }): string {
    if ('full_name' in user) {
        return user.full_name;
    }
    return generateFullName(user.first_name, user.last_name, user.email);
}

/**
 * Helper to check if user data is complete
 */
export function isUserDataComplete(user: Contributor | Contact): boolean {
    return !!(user.first_name && user.last_name && user.email);
}
