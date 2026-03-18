export class ActivityLog {
    id: number;
    inquiry_id: number;
    type: string; // "StatusChange", "Note", "DocumentSent", "CallLogged"
    description: string;
    created_at: Date;
}

export class CreateActivityLogDto {
    inquiry_id: number;
    type: string;
    description: string;
}

export class UpdateActivityLogDto {
    type?: string;
    description?: string;
}
