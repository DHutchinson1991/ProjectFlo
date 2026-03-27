import { IsNumber, IsOptional } from 'class-validator';

export class AssignCrewSlotDto {
  @IsNumber()
  @IsOptional()
  crew_member_id?: number | null;
}
