import { Module } from '@nestjs/common';
import { EditingStylesController } from './editing-styles.controller';
import { EditingStylesService } from './editing-styles.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [EditingStylesController],
  providers: [EditingStylesService, PrismaService],
  exports: [EditingStylesService],
})
export class EditingStylesModule {}