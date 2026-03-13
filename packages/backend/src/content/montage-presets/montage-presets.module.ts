import { Module } from '@nestjs/common';
import { MontagePresetsService } from './montage-presets.service';
import { MontagePresetsController } from './montage-presets.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MontagePresetsController],
    providers: [MontagePresetsService],
    exports: [MontagePresetsService],
})
export class MontagePresetsModule {}
