import { IsOptional, IsString } from 'class-validator';

export class ActiveTasksQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}