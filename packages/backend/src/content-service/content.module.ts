import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [],
  providers: [ContentService, PrismaService],
  exports: [ContentService],
})
export class ContentServiceModule { }