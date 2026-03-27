import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export enum QuoteStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    ACCEPTED = 'Accepted',
    EXPIRED = 'Expired',
    DECLINED = 'Declined',
}

export class CreateQuoteDto {
    @IsString()
    quote_number: string;

    @IsOptional()
    @IsString()
    title?: string = "New Quote";

    @IsOptional()
    @IsNumber()
    tax_rate?: number = 0;

    @IsOptional()
    @IsNumber()
    deposit_required?: number = 0;

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
    @IsNumber()
    installments?: number;

    @IsOptional()
    @IsBoolean()
    is_primary?: boolean = false;

    @IsDateString()
    issue_date: string;

    @IsDateString()
    expiry_date: string;

    @IsOptional()
    @IsString()
    consultation_notes?: string;

    @IsOptional()
    @IsEnum(QuoteStatus)
    status?: QuoteStatus = QuoteStatus.DRAFT;

    @IsOptional()
    project_id?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuoteItemDto)
    items: CreateQuoteItemDto[];
}
