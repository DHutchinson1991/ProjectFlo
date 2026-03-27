import { Module } from '@nestjs/common';
import { FilmLocationsService } from './film-locations.service';
import { FilmLocationsController } from './film-locations.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FilmLocationsController],
    providers: [FilmLocationsService],
    exports: [FilmLocationsService],
})
export class FilmLocationsModule { }
