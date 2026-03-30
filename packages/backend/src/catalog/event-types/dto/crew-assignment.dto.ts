import { IsInt, IsString, IsOptional } from 'class-validator';

export class CrewAssignmentDto {
  @IsInt()
  crewId!: number;

  @IsInt()
  jobRoleId!: number;

  @IsOptional()
  @IsString()
  label?: string;
}
