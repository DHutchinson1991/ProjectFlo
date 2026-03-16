import { Module } from '@nestjs/common';
import { ProposalsController } from './proposals.controller';
import { PublicProposalsController } from './public-proposals.controller';
import { ProposalsService } from './proposals.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProposalsController, PublicProposalsController],
    providers: [ProposalsService],
    exports: [ProposalsService],
})
export class ProposalsModule { }
