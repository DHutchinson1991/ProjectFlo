import { Module } from '@nestjs/common';
import { ServicePackageCategoriesService } from './service-package-categories.service';
import { ServicePackageCategoriesController } from './service-package-categories.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicePackageCategoriesController],
  providers: [ServicePackageCategoriesService],
})
export class ServicePackageCategoriesModule {}
