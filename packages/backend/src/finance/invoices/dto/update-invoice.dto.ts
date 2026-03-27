import { InvoiceStatus } from './create-invoice.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateInvoiceItemDto } from './update-invoice-item.dto';

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
