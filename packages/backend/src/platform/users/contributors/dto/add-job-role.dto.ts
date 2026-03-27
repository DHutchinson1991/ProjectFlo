import { IsNumber, IsNotEmpty } from 'class-validator';

export class AddJobRoleDto {
  @IsNumber()
  @IsNotEmpty()
  job_role_id: number;
}
