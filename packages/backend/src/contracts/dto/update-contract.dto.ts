import { PartialType } from '@nestjs/mapped-types';
import { CreateContractDto } from './create-contract.dto';
import { IsOptional, IsDate } from 'class-validator';

export class UpdateContractDto extends PartialType(CreateContractDto) {
    @IsOptional()
    @IsDate()
    sent_at?: Date;

    @IsOptional()
    @IsDate()
    signed_date?: Date;
}
