import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsObject, IsDateString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EquipmentCategory, EquipmentType, EquipmentCondition, EquipmentAvailability } from '@prisma/client';

export class CreateEquipmentDto {
    @IsString()
    item_name: string;

    @IsOptional()
    @IsString()
    item_code?: string;

    @IsEnum(EquipmentCategory)
    category: EquipmentCategory;

    @IsEnum(EquipmentType)
    type: EquipmentType;

    @IsOptional()
    @IsString()
    brand_name?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity?: number = 1;

    @IsOptional()
    @IsEnum(EquipmentCondition)
    condition?: EquipmentCondition = EquipmentCondition.GOOD;

    @IsOptional()
    @IsEnum(EquipmentAvailability)
    availability_status?: EquipmentAvailability = EquipmentAvailability.AVAILABLE;

    @IsOptional()
    @IsString()
    vendor?: string;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    rental_price_per_day?: number;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    purchase_price?: number;

    @IsOptional()
    @IsDateString()
    purchase_date?: string;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    weight_kg?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    power_usage_watts?: number;

    @IsOptional()
    @IsString()
    dimensions?: string;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    attachment_type?: string;

    @IsOptional()
    @IsString()
    compatibility?: string;

    @IsOptional()
    @IsString()
    serial_number?: string;

    @IsOptional()
    @IsDateString()
    warranty_expiry?: string;

    @IsOptional()
    @IsDateString()
    last_maintenance?: string;

    @IsOptional()
    @IsDateString()
    next_maintenance_due?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    photo_url?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    brand_id?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean = true;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    created_by_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    owner_id?: number;
}
