import { Module } from '@nestjs/common';
import { BeatsService } from './beats.service';
import { BeatsController } from './beats.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [BeatsController],
    providers: [BeatsService],
    exports: [BeatsService],
})
export class BeatsModule {}
