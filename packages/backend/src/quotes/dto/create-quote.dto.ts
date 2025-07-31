import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuoteStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    ACCEPTED = 'Accepted',
    EXPIRED = 'Expired',
    DECLINED = 'Declined',
}

export class CreateQuoteItemDto {
    @IsString()
    description: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    quantity: number = 1;

    @IsNumber({ maxDecimalPlaces: 2 })
    unit_price: number;
}

export class CreateQuoteDto {
    @IsString()
    quote_number: string;

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
