import { Module } from '@nestjs/common';
import { CoverageScenesController } from './coverage-scenes.controller';
import { CoverageScenes } from './coverage-scenes.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CoverageScenesController],
  providers: [CoverageScenes, PrismaService],
  exports: [CoverageScenes],
})
export class CoverageScenesModule {}