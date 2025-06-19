import { PartialType } from '@nestjs/mapped-types';
import { CreateEditingStyleDto } from './create-editing-style.dto';

export class UpdateEditingStyleDto extends PartialType(CreateEditingStyleDto) {}
