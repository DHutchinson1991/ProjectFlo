import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ExecuteAutoGenerationDto {
    @IsNumber()
    @Type(() => Number)
    projectId: number;

    @IsNumber()
    @Type(() => Number)
    packageId: number;

    @IsNumber()
    @Type(() => Number)
    brandId: number;
}
