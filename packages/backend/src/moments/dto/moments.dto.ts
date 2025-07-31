import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, IsEnum } from 'class-validator';

enum MusicType {
    NONE = 'NONE',
    SCENE_MATCHED = 'SCENE_MATCHED',
    ORCHESTRAL = 'ORCHESTRAL',
    PIANO = 'PIANO',
    MODERN = 'MODERN',
    VINTAGE = 'VINTAGE',
}

export class CreateMomentTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    scene_type?: string;

    @IsInt()
    @Min(0)
    order_index: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    default_duration?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateMomentTemplateDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    scene_type?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    order_index?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    default_duration?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class CreateSceneMomentDto {
    @IsInt()
    scene_id: number;

    @IsInt()
    @IsOptional()
    project_id?: number;

    @IsInt()
    @IsOptional()
    template_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(0)
    order_index: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class CreateSceneMomentBodyDto {
    @IsInt()
    @IsOptional()
    project_id?: number;

    @IsInt()
    @IsOptional()
    template_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(0)
    order_index: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateSceneMomentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    order_index?: number;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class ReorderMomentsDto {
    @IsInt({ each: true })
    moment_ids: number[];
}

export class CreateSceneMomentMusicDto {
    @IsInt()
    moment_id: number;

    @IsString()
    @IsOptional()
    music_name?: string;

    @IsString()
    @IsOptional()
    artist?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsEnum(MusicType)
    music_type: MusicType;

    @IsString()
    @IsOptional()
    file_path?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateSceneMomentMusicDto {
    @IsString()
    @IsOptional()
    music_name?: string;

    @IsString()
    @IsOptional()
    artist?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    duration?: number;

    @IsEnum(MusicType)
    @IsOptional()
    music_type?: MusicType;

    @IsString()
    @IsOptional()
    file_path?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
