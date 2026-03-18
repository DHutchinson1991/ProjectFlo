import { IsString, IsOptional, IsNumber, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateMomentDto {
    @IsNumber()
    @IsOptional() // Optional in DTO - set by controller from URL
    film_scene_id?: number;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    order_index?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    duration?: number;

    @IsInt()
    @IsOptional()
    source_activity_id?: number;
}
