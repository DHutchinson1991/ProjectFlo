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

export class UpdateInvoiceDto {
    @IsOptional()
    @IsString()
    invoice_number?: string;

    @IsOptional()
    @IsDateString()
    issue_date?: string;

    @IsOptional()
    @IsDateString()
    due_date?: string;

    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus;

    @IsOptional()
    project_id?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateInvoiceItemDto)
    items?: UpdateInvoiceItemDto[];
}
