import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignFilmLocationDto {
    @Type(() => Number)
    @IsInt()
    location_id: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
