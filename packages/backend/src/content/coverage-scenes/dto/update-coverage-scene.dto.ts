import { PartialType } from '@nestjs/mapped-types';
import { CreateCoverageSceneDto } from './create-coverage-scene.dto';

export class UpdateCoverageSceneDto extends PartialType(CreateCoverageSceneDto) {}
