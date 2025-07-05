/**
 * User and contact management types
 */

export interface Contact {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string;
  company_name?: string;
  type?: string;
}

export interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  type?: string;
}

export interface Contributor {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  contact: Contact; // Required nested contact object
  role: {
    id: number;
    name: string;
  }; // Required nested role object
  contributor_type?: string;
  default_hourly_rate?: number;
}

export interface ContributorData {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: {
    id: number;
    name: string;
  };
  contributor_type?: string;
  default_hourly_rate?: number;
}

export interface NewContributorData {
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  role_id: number;
  contributor_type?: string;
}

export interface UpdateContributorDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role_id?: number;
  contributor_type?: string;
}

// Team management types
export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  avatar?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
}
