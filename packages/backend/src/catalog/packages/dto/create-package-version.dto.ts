import { IsString, IsOptional } from 'class-validator';

export class CreatePackageVersionDto {
  @IsString()
  @IsOptional()
  change_summary?: string;
}
