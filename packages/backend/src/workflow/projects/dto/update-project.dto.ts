import { IsString, IsOptional, IsDateString, IsInt, IsEnum } from 'class-validator';
import { project_phase, project_status } from '@prisma/client';

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    project_name?: string;

    @IsOptional()
    @IsDateString()
    wedding_date?: string;

    @IsOptional()
    @IsDateString()
    booking_date?: string;

    @IsOptional()
    @IsDateString()
    edit_start_date?: string;

    @IsOptional()
    @IsDateString()
    delivery_date?: string;

    @IsOptional()
    @IsEnum(project_phase)
    phase?: project_phase;

    @IsOptional()
    @IsEnum(project_status)
    status?: project_status;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    guest_count?: string;

    @IsOptional()
    @IsInt()
    event_type_id?: number;

    @IsOptional()
    @IsInt()
    client_id?: number;

    @IsOptional()
    @IsInt()
    workflow_template_id?: number;
}
