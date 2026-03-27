import { Module } from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import { EventTypesLinkingService } from './services/event-types-linking.service';
import { EventTypesPackageBuilderService } from './services/event-types-package-builder.service';
import { EventTypesCrewBuilderService } from './services/event-types-crew-builder.service';
import { EventTypesDayContentBuilderService } from './services/event-types-day-content-builder.service';
import { EventTypesController } from './event-types.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventTypesController],
  providers: [EventTypesService, EventTypesLinkingService, EventTypesPackageBuilderService, EventTypesCrewBuilderService, EventTypesDayContentBuilderService],
  exports: [EventTypesService, EventTypesLinkingService],
})
export class EventTypesModule {}
