import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { FloorPlansModule } from '../../workflow/locations/modules/floor-plans/floor-plans.module';
import { GemmaModule } from '../gemma/gemma.module';
import { BlockingDirectorService } from './blocking-director.service';

@Module({
  imports: [PrismaModule, FloorPlansModule, GemmaModule],
  providers: [BlockingDirectorService],
  exports: [BlockingDirectorService],
})
export class BlockingModule {}