import { PartialType } from '@nestjs/mapped-types';
import { CreateContractDto } from './create-contract.dto';
import { IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateContractDto extends PartialType(CreateContractDto) {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    sent_at?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    signed_date?: Date;
}
