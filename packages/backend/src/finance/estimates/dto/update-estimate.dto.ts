import { EstimateStatus } from './create-estimate.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateEstimateItemDto } from './update-estimate-item.dto';

export class UpdateEstimateDto {
    @IsOptional()
    @IsString()
    estimate_number?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsDateString()
    issue_date?: string;

    @IsOptional()
    @IsDateString()
    expiry_date?: string;

    @IsOptional()
    @IsEnum(EstimateStatus)
    status?: EstimateStatus;

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

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateEstimateItemDto)
    items?: UpdateEstimateItemDto[];
}
