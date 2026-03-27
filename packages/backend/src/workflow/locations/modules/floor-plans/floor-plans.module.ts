import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../platform/prisma/prisma.module';
import { FloorPlansController } from './floor-plans.controller';
import { FloorPlansService } from './floor-plans.service';

/**
 * Module for managing floor plans within location spaces
 */
@Module({
    imports: [PrismaModule],
    controllers: [FloorPlansController],
    providers: [FloorPlansService],
    exports: [FloorPlansService],
})
export class FloorPlansModule { }
