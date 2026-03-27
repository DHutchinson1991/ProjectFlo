import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SignerDto {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    role?: string;
}