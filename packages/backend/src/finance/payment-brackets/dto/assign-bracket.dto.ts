import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignBracketDto {
  @IsInt()
  crew_member_id: number;

  @IsInt()
  job_role_id: number;

  @IsInt()
  payment_bracket_id: number;
}