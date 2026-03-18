import { IsString, IsOptional } from 'class-validator';

export class CreatePackageFromWeddingTypeDto {
  @IsString()
  packageName: string;

  @IsString()
  @IsOptional()
  packageDescription?: string;
}
