import { InvoiceStatus } from './create-invoice.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInvoiceItemDto {
    @IsOptional()
    id?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    quantity?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    unit_price?: number;
}