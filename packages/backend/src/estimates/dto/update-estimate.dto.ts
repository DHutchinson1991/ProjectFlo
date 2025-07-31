import { EstimateStatus } from './create-estimate.dto';
import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEstimateItemDto {
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

export class UpdateEstimateDto {
    @IsOptional()
    @IsString()
    estimate_number?: string;

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
    project_id?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateEstimateItemDto)
    items?: UpdateEstimateItemDto[];
}
