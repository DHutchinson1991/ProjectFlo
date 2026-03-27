import { Module, forwardRef } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController, ContractSigningController } from './contracts.controller';
import { ContractClausesService } from './contract-clauses.service';
import { ContractClausesController } from './contract-clauses.controller';
import { ContractTemplatesService } from './contract-templates.service';
import { ContractTemplateVariablesService } from './services/contract-template-variables.service';
import { ContractSigningService } from './services/contract-signing.service';
import { ContractTemplatesController } from './contract-templates.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TasksModule } from '../../workflow/tasks/tasks.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TasksModule), forwardRef(() => InvoicesModule)],
  controllers: [ContractsController, ContractSigningController, ContractClausesController, ContractTemplatesController],
  providers: [ContractsService, ContractClausesService, ContractTemplatesService, ContractTemplateVariablesService, ContractSigningService],
  exports: [ContractsService, ContractClausesService, ContractTemplatesService, ContractTemplateVariablesService],
})
export class ContractsModule { }
