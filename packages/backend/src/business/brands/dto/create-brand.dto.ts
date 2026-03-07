import { IsString, IsOptional, IsEmail, IsUrl, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

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

    @Transform(({ value }) => value === '' ? undefined : value)
    @IsUrl({}, { message: 'Website must be a valid URL' })
    @IsOptional()
    website?: string;

    @Transform(({ value }) => value === '' ? undefined : value)
    @IsEmail({}, { message: 'Email must be a valid email address' })
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

    @Transform(({ value }) => value === '' ? undefined : value)
    @IsUrl({}, { message: 'Logo URL must be a valid URL' })
    @IsOptional()
    logo_url?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
