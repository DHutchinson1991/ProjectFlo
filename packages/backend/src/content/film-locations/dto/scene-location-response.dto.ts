export class SceneLocationResponseDto {
    id: number;
    scene_id: number;
    location_id: number;
    created_at: Date;
    updated_at: Date;
    location: {
        id: number;
        name: string;
        address_line1?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
    };
}
