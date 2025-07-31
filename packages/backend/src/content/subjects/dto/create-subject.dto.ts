import { IsString, IsOptional, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';

export enum SubjectPriority {
    PRIMARY = 'PRIMARY',
    SECONDARY = 'SECONDARY',
    BACKGROUND = 'BACKGROUND'
}

export class CreateSubjectDto {
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsOptional()
    last_name?: string;

    @IsString()
    @IsNotEmpty()
    context_role: string;

    @IsString()
    @IsOptional()
    hair_color?: string;

    @IsString()
    @IsOptional()
    hair_style?: string;

    @IsString()
    @IsOptional()
    skin_tone?: string;

    @IsString()
    @IsOptional()
    height?: string;

    @IsString()
    @IsOptional()
    eye_color?: string;

    @IsString()
    @IsOptional()
    appearance_notes?: string;

    @IsNumber()
    @IsOptional()
    brand_id?: number;
}

export class AssignSubjectToSceneDto {
    @IsNumber()
    subject_id: number;

    @IsEnum(SubjectPriority)
    priority: SubjectPriority;
}

export class UpdateSceneSubjectDto {
    @IsEnum(SubjectPriority)
    priority: SubjectPriority;
}
