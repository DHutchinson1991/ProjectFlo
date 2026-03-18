import { IsInt, IsBoolean, IsOptional } from 'class-validator';

export class AssignJobRoleDto {
    @IsInt()
    contributor_id: number;

    @IsInt()
    job_role_id: number;

    @IsOptional()
    @IsBoolean()
    is_primary?: boolean;

    @IsOptional()
    @IsInt()
    assigned_by?: number;

    @IsOptional()
    @IsInt()
    payment_bracket_id?: number;
}

export class UpdateJobRoleAssignmentDto {
    @IsOptional()
    @IsBoolean()
    is_primary?: boolean;

    @IsOptional()
    @IsInt()
    payment_bracket_id?: number;
}
