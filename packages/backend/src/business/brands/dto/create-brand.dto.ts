import { IsString, IsOptional, IsEmail, IsUrl, IsBoolean, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

    @Type(() => Number)
    @IsNumber({}, { message: 'Tax rate must be a number' })
    @Min(0)
    @Max(100)
    @IsOptional()
    default_tax_rate?: number;

    @IsString()
    @IsOptional()
    tax_number?: string;

    @IsString()
    @IsOptional()
    default_payment_method?: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    payment_terms_days?: number;

    @IsString()
    @IsOptional()
    bank_name?: string;

    @IsString()
    @IsOptional()
    bank_account_name?: string;

    @IsString()
    @IsOptional()
    bank_sort_code?: string;

    @IsString()
    @IsOptional()
    bank_account_number?: string;

    @IsString()
    @IsOptional()
    crew_payment_terms?: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    crew_response_deadline_days?: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    inquiry_validity_days?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
