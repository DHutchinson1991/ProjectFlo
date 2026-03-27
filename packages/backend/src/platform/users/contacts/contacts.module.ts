import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from '../../../platform/prisma/prisma.module';
import { TasksModule } from '../../../workflow/tasks/tasks.module';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule { }
