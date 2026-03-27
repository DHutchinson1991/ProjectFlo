import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone_number?: string;

    @IsOptional()
    @IsString()
    company_name?: string;
}
