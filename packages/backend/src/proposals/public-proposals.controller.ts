import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    NotFoundException,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
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
    constructor(private readonly proposalsService: ProposalsService) { }

    @Get(':token')
    async getByShareToken(@Param('token') token: string) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid share token');
        }
        return this.proposalsService.findByShareToken(token);
    }

    @Post(':token/respond')
    async respond(
        @Param('token') token: string,
        @Body() dto: RespondToProposalDto,
    ) {
        if (!token || token.length < 10) {
            throw new NotFoundException('Invalid share token');
        }
        return this.proposalsService.respondToProposal(token, dto.response, dto.message);
    }
}
