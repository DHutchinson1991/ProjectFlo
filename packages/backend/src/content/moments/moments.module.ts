import { Module } from '@nestjs/common';
import { MomentsCrudService } from './moments-crud.service';
import { MomentRecordingSetupService } from './moment-recording-setup.service';
import { MomentsController } from './moments.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { FloorPlansModule } from '../../workflow/locations/modules/floor-plans/floor-plans.module';

@Module({
    imports: [PrismaModule, FloorPlansModule],
    controllers: [MomentsController],
    providers: [MomentsCrudService, MomentRecordingSetupService],
    exports: [MomentsCrudService],
})
export class MomentsModule { }
