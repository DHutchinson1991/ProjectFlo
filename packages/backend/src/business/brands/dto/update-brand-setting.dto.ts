import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandSettingDto } from './create-brand-setting.dto';

export class UpdateBrandSettingDto extends PartialType(CreateBrandSettingDto) { }
