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

    @IsOptional()
    @IsString()
    title?: string;

    @IsDateString()
    issue_date: string;

    @IsDateString()
    due_date: string;

    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus = InvoiceStatus.DRAFT;

    @IsOptional()
    @IsNumber()
    project_id?: number;

    @IsOptional()
    @IsNumber()
    quote_id?: number;

    @IsOptional()
    @IsNumber()
    proposal_id?: number;

    @IsOptional()
    @IsNumber()
    milestone_id?: number;

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

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];
}
