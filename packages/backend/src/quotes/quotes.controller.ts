import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Controller('api/inquiries/:inquiryId/quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) { }

    @Post()
    create(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Body() createQuoteDto: CreateQuoteDto
    ) {
        return this.quotesService.create(inquiryId, createQuoteDto);
    }

    @Get()
    findAll(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
        return this.quotesService.findAll(inquiryId);
    }

    @Get(':id')
    findOne(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.quotesService.findOne(inquiryId, id);
    }

    @Patch(':id')
    update(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateQuoteDto: UpdateQuoteDto
    ) {
        return this.quotesService.update(inquiryId, id, updateQuoteDto);
    }

    @Delete(':id')
    remove(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.quotesService.remove(inquiryId, id);
    }

    @Post(':id/send')
    send(
        @Param('inquiryId', ParseIntPipe) inquiryId: number,
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.quotesService.send(inquiryId, id);
    }
}
