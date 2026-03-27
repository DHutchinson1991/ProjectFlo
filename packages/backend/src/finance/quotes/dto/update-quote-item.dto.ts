import { QuoteStatus } from './create-quote.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQuoteItemDto {
    @IsOptional()
    id?: number;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    service_date?: string;

    @IsOptional()
    @IsString()
    start_time?: string;

    @IsOptional()
    @IsString()
    end_time?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    quantity?: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    unit_price?: number;
}