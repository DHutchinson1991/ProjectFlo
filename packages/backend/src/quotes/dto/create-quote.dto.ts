import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuoteStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    ACCEPTED = 'Accepted',
    EXPIRED = 'Expired',
    DECLINED = 'Declined',
}

export class CreateQuoteItemDto {
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
