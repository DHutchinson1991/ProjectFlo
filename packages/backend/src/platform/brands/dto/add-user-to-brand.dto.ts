import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class AddUserToBrandDto {
    @IsString()
    @IsIn(['Owner', 'Admin', 'Manager', 'Member'])
    role!: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
