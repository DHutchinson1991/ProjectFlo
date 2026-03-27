/**
 * Skill-Role Mapping Types — Canonical source.
 */

export interface SkillRoleMapping {
  id: number;
  skill_name: string;
  job_role_id: number;
  payment_bracket_id: number | null;
  brand_id: number | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  job_role?: {
    id: number;
    name: string;
    display_name?: string | null;
    category?: string | null;
  };
  payment_bracket?: {
    id: number;
    name: string;
    level: number;
    hourly_rate: number;
    day_rate: number | null;
  } | null;
  brand?: {
    id: number;
    name: string;
  } | null;
}

export interface ResolvedRoleResult {
  job_role_id: number;
  job_role_name: string;
  job_role_display_name: string | null;
  bracket_id: number | null;
  bracket_name: string | null;
  bracket_level: number | null;
  hourly_rate: number | null;
  day_rate: number | null;
  resolved_skill: string;
}

export interface SkillRoleMappingSummary {
  total_mappings: number;
  unique_skills: number;
  unique_roles: number;
  by_skill: Record<string, Array<{ role: string; priority: number }>>;
  by_role: Record<string, string[]>;
}

export interface AvailableSkill {
  skill_name: string;
  in_task_library: boolean;
  has_mapping: boolean;
  is_unmapped: boolean;
}

export interface CreateSkillRoleMappingData {
  skill_name: string;
  job_role_id: number;
  payment_bracket_id?: number;
  brand_id?: number;
  priority?: number;
}

export interface UpdateSkillRoleMappingData {
  skill_name?: string;
  job_role_id?: number;
  priority?: number;
  is_active?: boolean;
}

export interface BulkCreateSkillRoleMappingData {
  mappings: CreateSkillRoleMappingData[];
}

export interface ResolveSkillRoleData {
  skills_needed: string[];
  brand_id?: number;
}
