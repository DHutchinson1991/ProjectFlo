import { Module } from '@nestjs/common';
import { CoverageScenesController } from './coverage-scenes.controller';
import { CoverageScenes } from './coverage-scenes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoverageScenesController],
  providers: [CoverageScenes],
  exports: [CoverageScenes],
})
export class CoverageScenesModule { }