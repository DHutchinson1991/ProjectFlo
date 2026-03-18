import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateMomentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    duration?: number;
}
