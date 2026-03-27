import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
    @IsString()
    description: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    quantity: number = 1;

    @IsNumber({ maxDecimalPlaces: 2 })
    unit_price: number;
}