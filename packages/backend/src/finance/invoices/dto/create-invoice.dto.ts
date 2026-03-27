import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export enum InvoiceStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    PAID = 'Paid',
    OVERDUE = 'Overdue',
}

export class CreateInvoiceDto {
    @IsString()
    invoice_number: string;

    @IsDateString()
    issue_date: string;

    @IsDateString()
    due_date: string;

    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus = InvoiceStatus.DRAFT;

    @IsOptional()
    project_id?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];
}
