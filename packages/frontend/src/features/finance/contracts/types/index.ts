import type { OutputData } from '@editorjs/editorjs';
import type { PaymentScheduleTemplate } from '@/features/finance/payment-schedules/types';

export interface ContractIdentity {
    inquiryId: number;
    contractId: number;
}

export interface ContractTemplateIdentity {
    templateId: number;
}

export enum ContractStatus {
    DRAFT = "Draft",
    SENT = "Sent",
    SIGNED = "Signed",
    CANCELLED = "Cancelled",
}

export interface ContractSigner {
    id: number;
    contract_id: number;
    name: string;
    email: string;
    role: string;
    token: string;
    status: 'pending' | 'viewed' | 'signed';
    signed_at: string | null;
    signature_text: string | null;
    viewed_at: string | null;
    created_at: string;
}

export interface Contract {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    title: string;
    content?: OutputData | null;
    status: ContractStatus;
    created_at: Date;
    updated_at: Date;
    signing_token?: string | null;
    rendered_html?: string | null;
    template_id?: number | null;
    sent_at?: Date | null;
    signed_date?: Date | null;
    signers?: ContractSigner[];
    inquiry?: { id: number; contact_id: number; brand_id: number };
    project?: { id: number; name: string; status: string; created_at: Date; start_date?: Date | null; end_date?: Date | null } | null;
}

export interface ComposeContractData {
    template_id: number;
    title?: string;
}

export interface SendContractData {
    signers: Array<{ name: string; email: string; role?: string }>;
}

export interface SigningContractView {
    signer: {
        id: number;
        name: string;
        email: string;
        role: string;
        status: string;
        signed_at: string | null;
    };
    contract: {
        id: number;
        title: string;
        status: string;
        rendered_html: string | null;
        content: unknown;
        sent_at: string | null;
    };
    signers: Array<{
        name: string;
        role: string;
        status: string;
        signed_at: string | null;
    }>;
}

export interface CreateContractData {
    title: string;
    content?: OutputData;
    status?: ContractStatus;
    project_id?: number;
}

export interface UpdateContractData {
    title?: string;
    content?: OutputData;
    status?: ContractStatus;
    project_id?: number;
    signed_date?: Date | string | null;
}

export interface ContractClauseCategory {
    id: number;
    brand_id: number;
    name: string;
    description: string | null;
    order_index: number;
    is_default: boolean;
    country_code: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    clauses: ContractClause[];
}

export interface ContractClause {
    id: number;
    category_id: number;
    brand_id: number;
    title: string;
    body: string;
    clause_type: 'STANDARD' | 'EXTRA';
    country_code: string | null;
    is_default: boolean;
    is_active: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
    category?: ContractClauseCategory;
}

export interface CreateContractClauseCategoryData {
    name: string;
    description?: string;
    order_index?: number;
    country_code?: string;
}

export interface UpdateContractClauseCategoryData {
    name?: string;
    description?: string;
    order_index?: number;
    country_code?: string;
    is_active?: boolean;
}

export interface CreateContractClauseData {
    category_id: number;
    title: string;
    body: string;
    clause_type?: 'STANDARD' | 'EXTRA';
    country_code?: string;
    order_index?: number;
}

export interface UpdateContractClauseData {
    category_id?: number;
    title?: string;
    body?: string;
    clause_type?: 'STANDARD' | 'EXTRA';
    country_code?: string;
    is_active?: boolean;
    order_index?: number;
}

export interface ContractTemplateClause {
    id: number;
    template_id: number;
    clause_id: number;
    order_index: number;
    override_body: string | null;
    created_at: string;
    clause: ContractClause & { category: ContractClauseCategory | null };
}

export interface ContractTemplate {
    id: number;
    brand_id: number;
    name: string;
    description: string | null;
    payment_schedule_template_id: number | null;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    template_clauses: ContractTemplateClause[];
    payment_schedule?: PaymentScheduleTemplate | null;
}

export interface TemplateClauseInput {
    clause_id: number;
    order_index?: number;
    override_body?: string;
}

export interface CreateContractTemplateData {
    name: string;
    description?: string;
    payment_schedule_template_id?: number;
    is_default?: boolean;
    clauses?: TemplateClauseInput[];
}

export interface UpdateContractTemplateData {
    name?: string;
    description?: string;
    payment_schedule_template_id?: number | null;
    is_default?: boolean;
    is_active?: boolean;
    clauses?: TemplateClauseInput[];
}

export interface ContractVariableInfo {
    key: string;
    label: string;
    example: string;
}

export interface ContractVariableCategory {
    category: string;
    variables: ContractVariableInfo[];
}

export interface ContractPreviewSection {
    clause_id: number;
    title: string;
    category: string;
    body: string;
    order_index: number;
}

export interface ContractPreview {
    template_id: number;
    template_name: string;
    inquiry_id: number | null;
    sections: ContractPreviewSection[];
    available_variables: ContractVariableCategory[];
}
