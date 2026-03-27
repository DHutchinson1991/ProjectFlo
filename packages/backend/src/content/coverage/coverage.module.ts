import { Module } from '@nestjs/common';
import { CoverageService } from './coverage.service';
import { CoverageController } from './coverage.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoverageController],
  providers: [CoverageService],
  exports: [CoverageService],
})
export class CoverageModule {}
