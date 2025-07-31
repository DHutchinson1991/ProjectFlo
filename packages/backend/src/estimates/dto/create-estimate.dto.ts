import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum EstimateStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    ACCEPTED = 'Accepted',
    EXPIRED = 'Expired',
    DECLINED = 'Declined',
}

export class CreateEstimateItemDto {
    @IsString()
    description: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    quantity: number = 1;

    @IsNumber({ maxDecimalPlaces: 2 })
    unit_price: number;
}

export class CreateEstimateDto {
    @IsString()
    estimate_number: string;

    @IsDateString()
    issue_date: string;

    @IsDateString()
    expiry_date: string;

    @IsOptional()
    @IsEnum(EstimateStatus)
    status?: EstimateStatus = EstimateStatus.DRAFT;

    @IsOptional()
    project_id?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateEstimateItemDto)
    items: CreateEstimateItemDto[];
}
