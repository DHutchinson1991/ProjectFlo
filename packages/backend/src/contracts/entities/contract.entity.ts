import { JsonValue } from '@prisma/client/runtime/library';

export interface Contract {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    title: string;
    content: JsonValue | null;
    status: string;
    sent_at: Date | null;
    signed_date: Date | null;
}
