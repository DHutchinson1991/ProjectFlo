import { Module } from '@nestjs/common';
import { EventSubtypesService } from './event-subtypes.service';
import { EventSubtypesController } from './event-subtypes.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EventSubtypesController],
  providers: [EventSubtypesService, PrismaService],
  exports: [EventSubtypesService],
})
export class EventSubtypesModule {}
