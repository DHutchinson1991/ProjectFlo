import { IsNumber, IsOptional } from 'class-validator';

export class AssignCrewSlotDto {
  @IsNumber()
  @IsOptional()
  crew_id?: number | null;
}
