import { PartialType } from '@nestjs/mapped-types';
import { CreatePackageSetDto } from './create-package-set.dto';

export class UpdatePackageSetDto extends PartialType(CreatePackageSetDto) {}
