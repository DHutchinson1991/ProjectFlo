import { IsString, IsOptional, IsEmail, IsUrl, IsBoolean } from 'class-validator';

export class CreateBrandDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    display_name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    business_type?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address_line1?: string;

    @IsString()
    @IsOptional()
    address_line2?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    postal_code?: string;

    @IsString()
    @IsOptional()
    timezone?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsUrl()
    @IsOptional()
    logo_url?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
