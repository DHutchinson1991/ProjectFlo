import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateClientDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    first_name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    last_name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone_number?: string;

    @IsOptional()
    @IsString()
    company_name?: string;
}
