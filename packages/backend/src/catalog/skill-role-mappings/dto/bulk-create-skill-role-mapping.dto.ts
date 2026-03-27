import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSkillRoleMappingDto } from './create-skill-role-mapping.dto';

export class BulkCreateSkillRoleMappingDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSkillRoleMappingDto)
    mappings!: CreateSkillRoleMappingDto[];
}
