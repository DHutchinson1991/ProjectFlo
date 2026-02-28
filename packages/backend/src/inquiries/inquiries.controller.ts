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
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/inquiries.dto';

@Controller('api/inquiries')
@UseGuards(AuthGuard('jwt'))
export class InquiriesController {
    constructor(private readonly inquiriesService: InquiriesService) { }

    @Get()
    async findAll(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.findAll(brandIdNum);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        return this.inquiriesService.findOne(id, brandIdNum || 0);
    }

    @Post()
    async create(
        @Body() createInquiryDto: CreateInquiryDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.create(createInquiryDto, brandIdNum);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateInquiryDto: UpdateInquiryDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.update(id, updateInquiryDto, brandIdNum);
    }

    @Post(':id/convert')
    async convert(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.convertInquiryToProject(id, brandIdNum);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.inquiriesService.remove(id, brandIdNum);
    }
}
