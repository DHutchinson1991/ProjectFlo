// packages/backend/src/contributors/dto/create-contributor.dto.ts
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { contributors_type } from '@prisma/client';

export class CreateContributorDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8) // Example: Enforce a minimum password length
  password: string; // Changed from password_hash; service will handle hashing

  @IsNumber()
  @IsNotEmpty()
  role_id: number;

  @IsEnum(contributors_type)
  @IsOptional()
  contributor_type?: contributors_type;
}
