import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEstimateItemDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsDateString()
    service_date?: string;

    @IsOptional()
    @IsString()
    start_time?: string;

    @IsOptional()
    @IsString()
    end_time?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    quantity: number = 1;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    unit_price: number;
}