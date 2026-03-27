import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProjectPhase } from './task-library-enums.dto';

export class TaskLibraryQueryDto {
    @IsOptional()
    @IsEnum(ProjectPhase)
    phase?: ProjectPhase;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    brandId?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    search?: string;
}
