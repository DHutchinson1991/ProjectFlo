import { Module } from '@nestjs/common';
import { EventSubtypesService } from './event-subtypes.service';
import { EventSubtypesPackageBuilderService } from './services/event-subtypes-package-builder.service';
import { EventSubtypesController } from './event-subtypes.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventSubtypesController],
  providers: [EventSubtypesService, EventSubtypesPackageBuilderService],
  exports: [EventSubtypesService],
})
export class EventSubtypesModule {}
