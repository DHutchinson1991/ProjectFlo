import { IsString, IsOptional, IsInt, IsBoolean, IsEmail, IsNumber, IsEnum, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LocationPrecision } from '@prisma/client';

/**
 * DTO for creating a new location/venue
 */
export class CreateLocationDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    address_line1?: string;

    @IsOptional()
    @IsString()
    address_line2?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    country?: string = 'United States';

    @IsOptional()
    @IsString()
    postal_code?: string;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;

    @IsOptional()
    @IsEnum(LocationPrecision)
    precision?: LocationPrecision;

    @IsOptional()
    @IsString()
    contact_name?: string;

    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsEmail()
    contact_email?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    capacity?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    brand_id?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean = true;
}
