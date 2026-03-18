import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Headers,
    NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposals.dto';

@Controller('api/inquiries/:inquiryId/proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalsController {
    constructor(private readonly proposalsService: ProposalsService) { }

    @Get()
    async findAll(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.proposalsService.findAllByInquiry(inquiryId, brandIdNum);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.proposalsService.findOne(id, inquiryId, brandIdNum);
    }

    @Post()
    async create(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Body() createProposalDto: CreateProposalDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.proposalsService.create(inquiryId, createProposalDto, brandIdNum);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Body() updateProposalDto: UpdateProposalDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.proposalsService.update(id, inquiryId, updateProposalDto, brandIdNum);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.proposalsService.remove(id, inquiryId, brandIdNum);
    }

    @Post(':id/send')
    async sendProposal(
        @Param('id', ParseIntPipe) id: number,
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.proposalsService.sendProposal(id, inquiryId, brandIdNum);
    }

    @Post(':id/share-token')
    async generateShareToken(
        @Param('id', ParseIntPipe) id: number,
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        const token = await this.proposalsService.generateShareToken(id, inquiryId, brandIdNum);
        return { share_token: token };
    }
}
