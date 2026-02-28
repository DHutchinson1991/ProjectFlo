import { Module } from '@nestjs/common';
import { WeddingTypesService } from './wedding-types.service';
import { WeddingTypesController } from './wedding-types.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [WeddingTypesController],
  providers: [WeddingTypesService, PrismaService],
  exports: [WeddingTypesService],
})
export class WeddingTypesModule {}
