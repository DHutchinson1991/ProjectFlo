import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { CrewPresetsController } from './crew-presets.controller';
import { CrewPresetsService } from './crew-presets.service';

@Module({
  imports: [PrismaModule],
  controllers: [CrewPresetsController],
  providers: [CrewPresetsService],
  exports: [CrewPresetsService],
})
export class CrewPresetsModule {}
