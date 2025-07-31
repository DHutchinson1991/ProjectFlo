import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

/**
 * Module for managing location spaces within venues
 */
@Module({
    imports: [PrismaModule],
    controllers: [SpacesController],
    providers: [SpacesService],
    exports: [SpacesService],
})
export class SpacesModule { }
