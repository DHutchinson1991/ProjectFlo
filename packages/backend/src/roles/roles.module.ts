import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../prisma.service'; // Assuming PrismaService is in the parent directory

@Module({
  controllers: [RolesController],
  providers: [RolesService, PrismaService], // Provide PrismaService if RolesService needs it
})
export class RolesModule {}
