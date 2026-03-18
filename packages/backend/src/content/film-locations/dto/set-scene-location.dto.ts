import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SetSceneLocationDto {
    @Type(() => Number)
    @IsInt()
    location_id: number;
}
