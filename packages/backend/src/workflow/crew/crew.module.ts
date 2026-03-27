import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { CrewController } from './crew.controller';
import { CrewService } from './services/crew.service';
import { CrewManagementService } from './services/crew-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [CrewController],
  providers: [CrewService, CrewManagementService],
  exports: [CrewService, CrewManagementService],
})
export class CrewModule {}
