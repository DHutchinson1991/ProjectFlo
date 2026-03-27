import { IsString, IsInt } from 'class-validator';

export class CreateInstanceSubjectDto {
  @IsString()
  name: string;

  @IsInt()
  role_template_id: number;
}
