import { Module } from '@nestjs/common';
import { PackageSetsService } from './package-sets.service';
import { PackageSetsController } from './package-sets.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PackageSetsController],
  providers: [PackageSetsService],
  exports: [PackageSetsService],
})
export class PackageSetsModule {}
