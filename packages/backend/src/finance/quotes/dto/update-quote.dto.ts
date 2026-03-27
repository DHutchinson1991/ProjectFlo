import { QuoteStatus } from './create-quote.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateQuoteItemDto } from './update-quote-item.dto';

export class UpdateQuoteDto {
    @IsOptional()
    @IsString()
    quote_number?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsNumber()
    tax_rate?: number;

    @IsOptional()
    @IsNumber()
    deposit_required?: number;

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
    is_primary?: boolean;

    @IsOptional()
    @IsDateString()
    issue_date?: string;

    @IsOptional()
    @IsDateString()
    expiry_date?: string;

    @IsOptional()
    @IsString()
    consultation_notes?: string;

    @IsOptional()
    @IsEnum(QuoteStatus)
    status?: QuoteStatus;

    @IsOptional()
    project_id?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateQuoteItemDto)
    items?: UpdateQuoteItemDto[];
}
