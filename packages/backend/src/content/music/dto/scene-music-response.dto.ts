export class SceneMusicResponseDto {
    id: number;
    film_scene_id: number;
    music_name: string;
    artist: string | null;
    duration: number | null;
    music_type: string;
    created_at: Date;
    updated_at: Date;
}
