import { Module } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { ServicePackagesController } from './service-packages.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService],
  exports: [ServicePackagesService],
})
export class ServicePackagesModule {}
