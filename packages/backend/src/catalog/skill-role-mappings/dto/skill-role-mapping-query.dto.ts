import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SkillRoleMappingQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brandId?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    jobRoleId?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    paymentBracketId?: number;

    @IsOptional()
    @IsString()
    skill?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    include_inactive?: boolean;
}
