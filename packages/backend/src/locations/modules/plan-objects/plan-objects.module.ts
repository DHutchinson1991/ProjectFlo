import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PlanObjectsController } from './plan-objects.controller';
import { PlanObjectsService } from './plan-objects.service';

/**
 * Module for managing floor plan objects (furniture, equipment, etc.)
 */
@Module({
    imports: [PrismaModule],
    controllers: [PlanObjectsController],
    providers: [PlanObjectsService],
    exports: [PlanObjectsService],
})
export class PlanObjectsModule { }
