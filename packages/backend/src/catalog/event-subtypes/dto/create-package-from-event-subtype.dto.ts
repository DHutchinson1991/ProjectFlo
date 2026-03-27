import { IsString, IsOptional } from 'class-validator';

export class CreatePackageFromEventSubtypeDto {
  @IsString()
  packageName: string;

  @IsString()
  @IsOptional()
  packageDescription?: string;
}
