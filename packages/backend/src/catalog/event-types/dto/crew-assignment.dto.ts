import { IsInt, IsString, IsOptional } from 'class-validator';

export class CrewAssignmentDto {
  @IsInt()
  contributorId!: number;

  @IsInt()
  jobRoleId!: number;

  @IsOptional()
  @IsString()
  label?: string;
}
