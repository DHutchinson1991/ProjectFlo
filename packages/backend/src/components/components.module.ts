import { Module } from '@nestjs/common';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ComponentsController],
  providers: [ComponentsService, PrismaService],
  exports: [ComponentsService],
})
export class ComponentsModule {}
