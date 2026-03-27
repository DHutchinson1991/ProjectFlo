import { Module } from '@nestjs/common';
import { FilmStructureTemplatesService } from './film-structure-templates.service';
import { FilmStructureTemplatesController } from './film-structure-templates.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FilmStructureTemplatesController],
    providers: [FilmStructureTemplatesService],
    exports: [FilmStructureTemplatesService],
})
export class FilmStructureTemplatesModule {}
