import { InvoiceStatus } from './create-invoice.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateInvoiceItemDto } from './update-invoice-item.dto';

export class UpdateInvoiceDto {
    @IsOptional()
    @IsString()
    invoice_number?: string;

    @IsOptional()
    @IsString()
    title?: string;

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
    @IsNumber()
    project_id?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    tax_rate?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    terms?: string;

    @IsOptional()
    @IsString()
    payment_method?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateInvoiceItemDto)
    items?: UpdateInvoiceItemDto[];
}
