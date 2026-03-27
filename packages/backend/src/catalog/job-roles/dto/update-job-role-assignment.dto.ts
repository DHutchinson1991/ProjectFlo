import { IsInt, IsBoolean, IsOptional } from 'class-validator';

export class UpdateJobRoleAssignmentDto {
    @IsOptional()
    @IsBoolean()
    is_primary?: boolean;

    @IsOptional()
    @IsInt()
    payment_bracket_id?: number;
}
