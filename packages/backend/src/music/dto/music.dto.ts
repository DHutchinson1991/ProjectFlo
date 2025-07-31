import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum MusicType {
    NONE = 'NONE',
    SCENE_MATCHED = 'SCENE_MATCHED',
    ORCHESTRAL = 'ORCHESTRAL',
    PIANO = 'PIANO',
    MODERN = 'MODERN',
    VINTAGE = 'VINTAGE',
}

export class CreateMusicLibraryItemDto {
    @IsOptional()
    @IsString()
    assignment_number?: string;

    @IsOptional()
    @IsString()
    music_name?: string;

    @IsOptional()
    @IsString()
    artist?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(3600)
    duration?: number;

    @IsEnum(MusicType)
    music_type: MusicType;

    @IsOptional()
    @IsString()
    file_path?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsNumber()
    project_id?: number;

    @IsOptional()
    @IsNumber()
    brand_id?: number;
}

export class UpdateMusicLibraryItemDto {
    @IsOptional()
    @IsString()
    assignment_number?: string;

    @IsOptional()
    @IsString()
    music_name?: string;

    @IsOptional()
    @IsString()
    artist?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(3600)
    duration?: number;

    @IsOptional()
    @IsEnum(MusicType)
    music_type?: MusicType;

    @IsOptional()
    @IsString()
    file_path?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class AttachMusicToMomentDto {
    @IsNumber()
    music_library_item_id: number;
}
