import { QuoteStatus } from './create-quote.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQuoteItemDto {
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

export class UpdateQuoteDto {
    @IsOptional()
    @IsString()
    quote_number?: string;

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
