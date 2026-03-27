/**
 * Crew Types — Canonical source for workflow/crew domain.
 */

export interface CrewMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  crew_color?: string | null;
  bio?: string | null;
  job_roles: CrewJobRole[];
  primary_job_role?: CrewJobRole | null;
  brand_id: number;
  created_at: string;
  updated_at: string;
}

export interface CrewJobRole {
  id: number;
  name: string;
  is_primary: boolean;
}

export interface CrewWorkload {
  crew_member_id: number;
  first_name: string;
  last_name: string;
  active_projects: number;
  upcoming_tasks: number;
}

export interface CrewMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  crew_color?: string | null;
  bio?: string | null;
  job_roles: CrewJobRole[];
  primary_job_role?: CrewJobRole | null;
}

export interface UpdateCrewMemberDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string | null;
  crew_color?: string | null;
  bio?: string | null;
}

export interface NewCrewMemberData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface UpdateCrewProfileData {
  crew_color?: string | null;
  bio?: string | null;
}
