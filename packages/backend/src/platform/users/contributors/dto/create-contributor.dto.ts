import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

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
}
