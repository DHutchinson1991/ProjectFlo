import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController, ContractSigningController } from './contracts.controller';
import { ContractClausesService } from './contract-clauses.service';
import { ContractClausesController } from './contract-clauses.controller';
import { ContractTemplatesService } from './contract-templates.service';
import { ContractTemplatesController } from './contract-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContractsController, ContractSigningController, ContractClausesController, ContractTemplatesController],
  providers: [ContractsService, ContractClausesService, ContractTemplatesService],
  exports: [ContractsService, ContractClausesService, ContractTemplatesService],
})
export class ContractsModule { }
