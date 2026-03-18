import { Module } from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import { EventTypesController } from './event-types.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EventTypesController],
  providers: [EventTypesService, PrismaService],
  exports: [EventTypesService],
})
export class EventTypesModule {}
