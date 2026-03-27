import { IsString, IsOptional, IsDateString, IsInt } from 'class-validator';

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
    @IsString()
    phase?: string;

    @IsOptional()
    @IsInt()
    client_id?: number;

    @IsOptional()
    @IsInt()
    workflow_template_id?: number;
}
