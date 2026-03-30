/**
 * Crew feature-local types.
 * Domain entities come from shared user types to keep a single source of truth.
 */

import type { Crew as SharedCrew, NewCrewData, UpdateCrewDto } from '@/shared/types/users';

export type Crew = SharedCrew;

export interface CrewJobRole {
  id: number;
  name: string;
  is_primary: boolean;
}

export interface CrewWorkload {
  crew_id: number;
  first_name: string;
  last_name: string;
  active_projects: number;
  upcoming_tasks: number;
}

export interface SetCrewStatusData {
  is_active?: boolean;
  archived_at?: string | null;
}

export interface UpdateCrewProfileData {
  crew_color?: string | null;
  bio?: string | null;
}