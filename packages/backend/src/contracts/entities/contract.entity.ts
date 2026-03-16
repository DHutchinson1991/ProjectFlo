import { JsonValue } from '@prisma/client/runtime/library';

export interface ContractSigner {
    id: number;
    contract_id: number;
    name: string;
    email: string;
    role: string;
    token: string;
    status: string;
    signed_at: Date | null;
    signature_text: string | null;
    signer_ip: string | null;
    viewed_at: Date | null;
    created_at: Date;
}

export interface Contract {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    title: string;
    content: JsonValue | null;
    status: string;
    sent_at: Date | null;
    signed_date: Date | null;
    signing_token: string | null;
    rendered_html: string | null;
    template_id: number | null;
    signers?: ContractSigner[];
}
