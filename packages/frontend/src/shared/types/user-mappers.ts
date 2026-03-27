/**
 * User API Mappers — Canonical source.
 *
 * Transform backend API responses into frontend domain models.
 */

import type {
    CrewMemberApiResponse,
    ContactApiResponse,
    RoleApiResponse,
    CrewMemberJobRoleApiResponse,
    JobRoleApiResponse,
} from './user-api';

import type { CrewMember, Contact, Role } from './users';
import type { JobRole, CrewMemberJobRole } from '@/features/catalog/task-library/types/job-roles';

function nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
}

function parseDecimalToNumber(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
}

function generateInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
}

function generateFullName(firstName?: string, lastName?: string, email?: string): string {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email || 'Unknown User';
}

export function mapJobRoleResponse(apiResponse: JobRoleApiResponse): JobRole {
    return {
        id: apiResponse.id,
        name: apiResponse.name,
        display_name: apiResponse.display_name,
        description: apiResponse.description,
        category: apiResponse.category,
        is_active: apiResponse.is_active,
        created_at: apiResponse.created_at,
        updated_at: apiResponse.updated_at,
    };
}

export function mapCrewMemberJobRoleResponse(apiResponse: CrewMemberJobRoleApiResponse): CrewMemberJobRole {
    return {
        id: apiResponse.id,
        crew_member_id: apiResponse.crew_member_id,
        job_role_id: apiResponse.job_role_id,
        is_primary: apiResponse.is_primary ?? false,
        payment_bracket_id: apiResponse.payment_bracket_id ?? null,
        created_at: apiResponse.assigned_at,
        updated_at: apiResponse.assigned_at,
        job_role: mapJobRoleResponse(apiResponse.job_role),
        payment_bracket: apiResponse.payment_bracket
            ? {
                  id: apiResponse.payment_bracket.id,
                  name: apiResponse.payment_bracket.name,
                  display_name: apiResponse.payment_bracket.display_name,
                  level: apiResponse.payment_bracket.level,
                  hourly_rate:
                      typeof apiResponse.payment_bracket.hourly_rate === 'string'
                          ? parseFloat(apiResponse.payment_bracket.hourly_rate)
                          : apiResponse.payment_bracket.hourly_rate,
                  day_rate:
                      apiResponse.payment_bracket.day_rate != null
                          ? typeof apiResponse.payment_bracket.day_rate === 'string'
                              ? parseFloat(apiResponse.payment_bracket.day_rate)
                              : apiResponse.payment_bracket.day_rate
                          : null,
                  overtime_rate:
                      apiResponse.payment_bracket.overtime_rate != null
                          ? typeof apiResponse.payment_bracket.overtime_rate === 'string'
                              ? parseFloat(apiResponse.payment_bracket.overtime_rate)
                              : apiResponse.payment_bracket.overtime_rate
                          : null,
                  color: apiResponse.payment_bracket.color ?? null,
              }
            : null,
    };
}

export function mapRoleResponse(apiResponse: RoleApiResponse): Role {
    return {
        id: apiResponse.id,
        name: apiResponse.name,
        description: apiResponse.description,
        brand_id: apiResponse.brand_id,
    };
}

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
        full_name: generateFullName(
            nullToUndefined(apiResponse.first_name),
            nullToUndefined(apiResponse.last_name),
        ),
    };
}

export function mapCrewMemberResponse(apiResponse: CrewMemberApiResponse): CrewMember {
    const contact = mapContactResponse(apiResponse.contact);
    const role = apiResponse.role ? mapRoleResponse(apiResponse.role) : null;
    const CrewMemberJobRoles = apiResponse.job_role_assignments
        ? apiResponse.job_role_assignments.map(mapCrewMemberJobRoleResponse)
        : [];

    return {
        id: apiResponse.id,
        contact_id: apiResponse.contact_id,
        role_id: apiResponse.role_id,
        archived_at: apiResponse.archived_at,
        crew_color: apiResponse.crew_color ?? null,
        bio: apiResponse.bio ?? null,
        contact,
        role,
        job_role_assignments: CrewMemberJobRoles,
        email: contact.email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: generateFullName(contact.first_name, contact.last_name, contact.email),
        initials: generateInitials(contact.first_name, contact.last_name),
    };
}

export function mapContributorsListResponse(apiResponses: CrewMemberApiResponse[]): CrewMember[] {
    return apiResponses.map(mapCrewMemberResponse);
}

export function mapContactsListResponse(apiResponses: ContactApiResponse[]): Contact[] {
    return apiResponses.map(mapContactResponse);
}

export function mapRolesListResponse(apiResponses: RoleApiResponse[]): Role[] {
    return apiResponses.map(mapRoleResponse);
}

export function getUserInitials(
    user: CrewMember | Contact | { first_name?: string; last_name?: string },
): string {
    if ('initials' in user) return user.initials;
    return generateInitials(user.first_name, user.last_name);
}

export function getUserDisplayName(
    user: CrewMember | Contact | { first_name?: string; last_name?: string; email?: string },
): string {
    if ('full_name' in user) return user.full_name;
    return generateFullName(user.first_name, user.last_name, user.email);
}

export function isUserDataComplete(user: CrewMember | Contact): boolean {
    return !!(user.first_name && user.last_name && user.email);
}
