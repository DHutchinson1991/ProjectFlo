import { Module } from '@nestjs/common';
import { PackageTemplatesService } from './package-templates.service';
import { PackageTemplatesController } from './package-templates.controller';
import { PrismaModule } from '../../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PackageTemplatesController],
  providers: [PackageTemplatesService],
  exports: [PackageTemplatesService],
})
export class PackageTemplatesModule {}
