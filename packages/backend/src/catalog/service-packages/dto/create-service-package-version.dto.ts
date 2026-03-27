import { IsString, IsOptional } from 'class-validator';

export class CreateServicePackageVersionDto {
  @IsString()
  @IsOptional()
  change_summary?: string;
}
