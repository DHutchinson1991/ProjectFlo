import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, ParseIntPipe, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('api/inquiries/:inquiryId/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) { }

  @Post('regenerate')
  async regenerate(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Headers('x-brand-context') brandHeader: string,
  ) {
    const brandId = parseInt(brandHeader, 10);
    await this.invoicesService.autoGenerateFromQuoteMilestones(inquiryId, brandId);
    return { success: true };
  }

  @Post()
  create(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Body(new ValidationPipe({ transform: true })) createInvoiceDto: CreateInvoiceDto
  ) {
    return this.invoicesService.create(inquiryId, createInvoiceDto);
  }

  @Get()
  findAll(@Param('inquiryId', ParseIntPipe) inquiryId: number) {
    return this.invoicesService.findAll(inquiryId);
  }

  @Get(':id')
  findOne(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.invoicesService.findOne(inquiryId, id);
  }

  @Patch(':id')
  update(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) updateInvoiceDto: UpdateInvoiceDto
  ) {
    return this.invoicesService.update(inquiryId, id, updateInvoiceDto);
  }

  @Delete(':id')
  remove(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.invoicesService.remove(inquiryId, id);
  }

  @Post(':id/payments')
  recordPayment(
    @Param('inquiryId', ParseIntPipe) inquiryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true })) dto: RecordPaymentDto,
  ) {
    return this.invoicesService.recordPayment(inquiryId, id, dto);
  }
}
