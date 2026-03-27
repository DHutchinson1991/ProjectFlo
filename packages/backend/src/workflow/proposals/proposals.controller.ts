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
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProposalCrudService } from './services/proposal-crud.service';
import { ProposalLifecycleService } from './services/proposal-lifecycle.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposals.dto';

@Controller('api/inquiries/:inquiryId/proposals')
@UseGuards(AuthGuard('jwt'))
export class ProposalsController {
    constructor(
        private readonly crudService: ProposalCrudService,
        private readonly lifecycleService: ProposalLifecycleService,
    ) { }

    @Get()
    async findAll(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.crudService.findAllByInquiry(inquiryId, brandIdNum);
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
        return this.crudService.findOne(id, inquiryId, brandIdNum);
    }

    @Post()
    async create(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Body(new ValidationPipe({ transform: true })) createProposalDto: CreateProposalDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.crudService.create(inquiryId, createProposalDto, brandIdNum);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Body(new ValidationPipe({ transform: true })) updateProposalDto: UpdateProposalDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.crudService.update(id, inquiryId, updateProposalDto, brandIdNum);
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
        return this.crudService.remove(id, inquiryId, brandIdNum);
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
        return this.lifecycleService.sendProposal(id, inquiryId, brandIdNum);
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
        const token = await this.lifecycleService.generateShareToken(id, inquiryId, brandIdNum);
        return { share_token: token };
    }
}
