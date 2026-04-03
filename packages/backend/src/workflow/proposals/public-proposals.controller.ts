import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { ProposalLifecycleService } from './services/proposal-lifecycle.service';
import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class RespondToProposalDto {
    @IsString()
    @IsIn(['Accepted', 'ChangesRequested', 'Reconsideration'])
    response: string;

    @IsString()
    @IsOptional()
    message?: string;
}

class RecordSectionViewDto {
    @IsString()
    section_type: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    duration_seconds?: number;
}

class SaveSectionNoteDto {
    @IsString()
    section_type: string;

    @IsString()
    note: string;
}

@Controller('api/proposals/share')
export class PublicProposalsController {
    constructor(private readonly lifecycleService: ProposalLifecycleService) { }

    @Get(':token')
    async getByShareToken(
        @Param('token') token: string,
        @Query('preview') preview?: string,
    ) {
        return this.lifecycleService.findByShareToken(token, preview === 'true');
    }

    @Post(':token/respond')
    async respond(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) dto: RespondToProposalDto,
    ) {
        return this.lifecycleService.respondToProposal(token, dto.response, dto.message);
    }

    @Post(':token/section-view')
    async recordSectionView(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) dto: RecordSectionViewDto,
    ) {
        return this.lifecycleService.recordSectionView(token, dto.section_type, dto.duration_seconds);
    }

    @Post(':token/section-note')
    async saveSectionNote(
        @Param('token') token: string,
        @Body(new ValidationPipe({ transform: true })) dto: SaveSectionNoteDto,
    ) {
        return this.lifecycleService.saveSectionNote(token, dto.section_type, dto.note);
    }
}
