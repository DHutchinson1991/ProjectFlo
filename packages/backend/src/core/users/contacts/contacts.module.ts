import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { InquiryTasksModule } from '../../../inquiry-tasks/inquiry-tasks.module';

@Module({
  imports: [PrismaModule, InquiryTasksModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule { }
