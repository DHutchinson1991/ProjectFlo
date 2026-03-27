import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ValidationPipe,
} from '@nestjs/common';
import { ProposalLifecycleService } from './services/proposal-lifecycle.service';
import { IsString, IsOptional, IsIn } from 'class-validator';

class RespondToProposalDto {
    @IsString()
    @IsIn(['Accepted', 'ChangesRequested'])
    response: string;

    @IsString()
    @IsOptional()
    message?: string;
}

@Controller('api/proposals/share')
export class PublicProposalsController {
    constructor(private readonly lifecycleService: ProposalLifecycleService) { }

    @Get(':token')
    async getByShareToken(@Param('token') token: string) {
        return this.lifecycleService.findByShareToken(token);
    }

    @Post(':token/respond')
    async respond(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) dto: RespondToProposalDto,
    ) {
        return this.lifecycleService.respondToProposal(token, dto.response, dto.message);
    }
}
