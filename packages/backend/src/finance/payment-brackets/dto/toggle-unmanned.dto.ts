import { IsBoolean } from 'class-validator';

export class ToggleUnmannedDto {
  @IsBoolean()
  is_unmanned: boolean;
}
