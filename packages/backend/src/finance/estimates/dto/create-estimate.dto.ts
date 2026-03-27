import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEstimateItemDto } from './create-estimate-item.dto';

export enum EstimateStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    ACCEPTED = 'Accepted',
    EXPIRED = 'Expired',
    DECLINED = 'Declined',
}

export class CreateEstimateDto {
    @IsString()
    estimate_number: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsDateString()
    issue_date: string;

    @IsDateString()
    expiry_date: string;

    @IsOptional()
    @IsEnum(EstimateStatus)
    status?: EstimateStatus = EstimateStatus.DRAFT;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    tax_rate?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
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
    project_id?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateEstimateItemDto)
    items: CreateEstimateItemDto[];
}
