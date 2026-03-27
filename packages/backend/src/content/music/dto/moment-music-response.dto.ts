export class MomentMusicResponseDto {
    id: number;
    moment_id: number;
    music_name: string;
    artist: string | null;
    duration: number | null;
    music_type: string;
    overrides_scene_music: boolean;
    created_at: Date;
    updated_at: Date;
}
