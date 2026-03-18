/**
 * Crew Domain Types
 *
 * Types for the crew management system.
 * Crew members are contributors with is_crew = true who can be assigned to packages/events.
 */

// ============================================================================
// CREW MEMBER (A contributor who is part of the production crew)
// ============================================================================

export interface CrewMember {
  id: number;
  contact_id: number;
  contact: {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    phone_number?: string | null;
    company_name?: string | null;
  };
  role?: { id: number; name: string } | null;
  contributor_type?: string | null;
  default_hourly_rate?: number;
  is_crew: boolean;
  crew_color?: string | null;
  bio?: string | null;
  archived_at?: string | null;
  contributor_job_roles: Array<{
    id: number;
    is_primary: boolean;
    job_role: {
      id: number;
      name: string;
      display_name?: string | null;
      category?: string | null;
    };
  }>;
  user_brands?: Array<{ role: string }>;

  // Computed for convenience
  full_name: string;
  initials: string;
  primary_job_role?: string | null;
}

// ============================================================================
// CREW WORKLOAD SUMMARY
// ============================================================================

export interface CrewWorkloadSummary {
  id: number;
  name: string;
  email: string;
  crew_color?: string | null;
  primary_role?: string | null;
  default_hourly_rate?: number;
  package_assignments: number;
  project_assignments: number;
}

// ============================================================================
// PACKAGE CREW SLOT (maps to PackageDayOperator)
// ============================================================================

export interface PackageCrewSlot {
  id: number;
  package_id: number;
  event_day_template_id: number;
  contributor_id?: number | null;
  package_activity_id?: number | null;
  position_name: string;
  position_color?: string | null;
  job_role_id?: number | null;
  hours: number;
  notes?: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;

  // Relations
  contributor?: {
    id: number;
    crew_color?: string | null;
    contact: {
      id: number;
      first_name?: string | null;
      last_name?: string | null;
      email: string;
    };
    contributor_job_roles?: Array<{
      is_primary: boolean;
      job_role: {
        id: number;
        name: string;
        display_name?: string | null;
      };
    }>;
  } | null;
  job_role?: {
    id: number;
    name: string;
    display_name?: string | null;
    category?: string | null;
  } | null;
  equipment: Array<{
    id: number;
    equipment_id: number;
    is_primary: boolean;
    equipment?: {
      id: number;
      item_name: string;
      model?: string | null;
      category?: string;
    };
  }>;
  event_day?: { id: number; name: string };
  package_activity?: { id: number; name: string } | null;
  activity_assignments?: Array<{
    id: number;
    package_activity: { id: number; name: string };
  }>;
}

// ============================================================================
// DTOs
// ============================================================================

export interface AddCrewSlotDto {
  event_day_template_id: number;
  position_name: string;
  position_color?: string | null;
  contributor_id?: number | null;
  job_role_id?: number | null;
  hours?: number;
  notes?: string;
  package_activity_id?: number | null;
}

export interface UpdateCrewSlotDto {
  position_name?: string;
  position_color?: string | null;
  contributor_id?: number | null;
  job_role_id?: number | null;
  hours?: number;
  notes?: string | null;
  order_index?: number;
  package_activity_id?: number | null;
}

export interface SetCrewStatusDto {
  is_crew: boolean;
  crew_color?: string | null;
  bio?: string | null;
}

export interface UpdateCrewProfileDto {
  crew_color?: string | null;
  bio?: string | null;
  default_hourly_rate?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Derive full name from a crew member or crew contributor object */
export function getCrewMemberName(contact: { first_name?: string | null; last_name?: string | null }): string {
  return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed';
}

/** Get initials from a name */
export function getCrewInitials(contact: { first_name?: string | null; last_name?: string | null }): string {
  const first = contact.first_name?.[0] || '';
  const last = contact.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

/** Get the effective display color for a crew slot */
export function getSlotColor(slot: PackageCrewSlot): string {
  return slot.position_color || slot.contributor?.crew_color || '#EC4899';
}

/** Default crew colors palette for quick assignment */
export const CREW_COLORS = [
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
] as const;
