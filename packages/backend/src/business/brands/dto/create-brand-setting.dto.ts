import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateBrandSettingDto {
    @IsString()
    key: string;

    @IsString()
    value: string;

    @IsString()
    @IsIn(['string', 'boolean', 'number', 'json'])
    @IsOptional()
    data_type?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
