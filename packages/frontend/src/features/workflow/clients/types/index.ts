/**
 * Client Types — Canonical source.
 */

import type { Contact } from '@/shared/types/users';
import type { Inquiry } from '@/features/workflow/inquiries/types/inquiry';

export interface ClientProject {
    id: number;
    name: string;
    status: string;
    created_at: Date;
    start_date?: Date | null;
    end_date?: Date | null;
}

export interface Client {
    id: number;
    contact: Contact;
    contact_id: number;
    brand_id: number;
    created_at: Date;
    updated_at: Date;
    projects: ClientProject[];
    latest_project?: ClientProject | null;
    inquiry?: Inquiry | null;
}

export interface ClientListItem {
    id: number;
    contact: Contact;
    contact_id: number;
    latest_project_name: string | null;
    latest_wedding_date: Date | null;
}

export interface CreateClientData {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    company_name?: string;
}

export interface UpdateClientData {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    company_name?: string;
}
