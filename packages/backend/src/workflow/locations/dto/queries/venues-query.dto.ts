import { IsIn, IsOptional, IsString } from 'class-validator';

export class VenuesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @IsIn(['small', 'medium', 'large', 'unknown'])
  capacity?: 'small' | 'medium' | 'large' | 'unknown';
}
