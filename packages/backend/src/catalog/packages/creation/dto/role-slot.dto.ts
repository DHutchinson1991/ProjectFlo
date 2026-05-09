import { IsInt, Min } from 'class-validator';

export class RoleSlotDto {
  @IsInt()
  jobRoleId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
