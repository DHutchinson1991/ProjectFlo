import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { Estimate } from './entities/estimate.entity';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class EstimatesService {
  constructor(private prisma: PrismaService) { }

  async create(inquiryId: number, createEstimateDto: CreateEstimateDto): Promise<Estimate> {
    // Calculate total amount from items
    const totalAmount = createEstimateDto.items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price),
      0
    );

    return await this.prisma.$transaction(async (tx) => {
      // Handle Primary Exclusivity
      if (createEstimateDto.is_primary) {
        await tx.estimates.updateMany({
          where: { inquiry_id: inquiryId, is_primary: true },
          data: { is_primary: false }
        });
      }

      // Create the estimate
      const estimate = await tx.estimates.create({
        data: {
          inquiry_id: inquiryId,
          project_id: createEstimateDto.project_id || null,
          estimate_number: createEstimateDto.estimate_number,
          title: createEstimateDto.title,
          is_primary: createEstimateDto.is_primary || false,
          issue_date: new Date(createEstimateDto.issue_date),
          expiry_date: new Date(createEstimateDto.expiry_date),
          total_amount: new Decimal(totalAmount),
          status: createEstimateDto.status || 'Draft',
          tax_rate: createEstimateDto.tax_rate ? new Decimal(createEstimateDto.tax_rate) : new Decimal(0),
          deposit_required: createEstimateDto.deposit_required ? new Decimal(createEstimateDto.deposit_required) : null,
          notes: createEstimateDto.notes,
          terms: createEstimateDto.terms,
          payment_method: createEstimateDto.payment_method,
          installments: createEstimateDto.installments,
        },
      });

      // Create estimate items
      if (createEstimateDto.items && createEstimateDto.items.length > 0) {
        await tx.estimate_items.createMany({
          data: createEstimateDto.items.map(item => ({
            estimate_id: estimate.id,
            category: item.category,
            description: item.description,
            service_date: item.service_date ? new Date(item.service_date) : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            unit_price: new Decimal(item.unit_price),
          })),
        });
      }

      // Return estimate with converted total_amount for Estimate interface
      return {
        ...estimate,
        total_amount: totalAmount,
      } as unknown as Estimate;
    });
  }

  async findAll(inquiryId: number) {
    const estimates = await this.prisma.estimates.findMany({
      where: { inquiry_id: inquiryId },
      include: {
        items: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Convert Decimal to number for the interface
    return estimates.map(estimate => ({
      ...estimate,
      total_amount: Number(estimate.total_amount),
      tax_rate: estimate.tax_rate ? Number(estimate.tax_rate) : undefined,
      deposit_required: estimate.deposit_required ? Number(estimate.deposit_required) : undefined,
      items: estimate.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    }));
  }

  async findOne(inquiryId: number, id: number) {
    const estimate = await this.prisma.estimates.findFirst({
      where: {
        id: id,
        inquiry_id: inquiryId,
      },
      include: {
        items: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException(`Estimate with ID ${id} not found for inquiry ${inquiryId}`);
    }

    // Convert Decimal to number for the interface
    return {
      ...estimate,
      total_amount: Number(estimate.total_amount),
      items: estimate.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };
  }

  async update(inquiryId: number, id: number, updateEstimateDto: UpdateEstimateDto) {
    // First verify the estimate exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    return await this.prisma.$transaction(async (tx) => {
      let totalAmount: number | undefined;

      // If items are being updated, calculate new total
      if (updateEstimateDto.items) {
        totalAmount = updateEstimateDto.items.reduce(
          (sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)),
          0
        );

        // Delete existing items
        await tx.estimate_items.deleteMany({
          where: { estimate_id: id },
        });

        // Create new items
        await Promise.all(
          updateEstimateDto.items.map(item =>
            tx.estimate_items.create({
              data: {
                estimate_id: id,
                description: item.description || '',
                quantity: item.quantity || 0,
                unit_price: new Decimal(item.unit_price || 0),
              },
            })
          )
        );
      }

      // Build update data with proper typing
      const updateData: {
        estimate_number?: string;
        issue_date?: Date;
        expiry_date?: Date;
        status?: string;
        tax_rate?: Decimal;
        deposit_required?: Decimal | null;
        notes?: string;
        terms?: string;
        payment_method?: string;
        installments?: number;
        is_primary?: boolean;
        title?: string;
        project_id?: number | null;
        total_amount?: Decimal;
      } = {};

      if (updateEstimateDto.estimate_number) updateData.estimate_number = updateEstimateDto.estimate_number;
      if (updateEstimateDto.title !== undefined) updateData.title = updateEstimateDto.title;
      if (updateEstimateDto.issue_date) updateData.issue_date = new Date(updateEstimateDto.issue_date);
      if (updateEstimateDto.expiry_date) updateData.expiry_date = new Date(updateEstimateDto.expiry_date);
      if (updateEstimateDto.status) updateData.status = updateEstimateDto.status;
      if (updateEstimateDto.tax_rate !== undefined) updateData.tax_rate = new Decimal(updateEstimateDto.tax_rate);
      if (updateEstimateDto.deposit_required !== undefined) updateData.deposit_required = updateEstimateDto.deposit_required ? new Decimal(updateEstimateDto.deposit_required) : null;
      if (updateEstimateDto.notes !== undefined) updateData.notes = updateEstimateDto.notes;
      if (updateEstimateDto.terms !== undefined) updateData.terms = updateEstimateDto.terms;
      if (updateEstimateDto.payment_method !== undefined) updateData.payment_method = updateEstimateDto.payment_method;
      if (updateEstimateDto.installments !== undefined) updateData.installments = updateEstimateDto.installments;
      if (updateEstimateDto.is_primary !== undefined) {
        updateData.is_primary = updateEstimateDto.is_primary;
        if (updateEstimateDto.is_primary) {
          await tx.estimates.updateMany({
            where: { inquiry_id: inquiryId, id: { not: id }, is_primary: true },
            data: { is_primary: false }
          });
        }
      }
      if (updateEstimateDto.project_id !== undefined) updateData.project_id = updateEstimateDto.project_id;
      if (totalAmount !== undefined) updateData.total_amount = new Decimal(totalAmount);

      // Handle items update
      if (updateEstimateDto.items) {
        // Simple strategy: Delete all and recreate based on the complexity of syncing
        await tx.estimate_items.deleteMany({
          where: { estimate_id: id },
        });

        await tx.estimate_items.createMany({
          data: updateEstimateDto.items.map(item => ({
            estimate_id: id,
            category: item.category,
            description: item.description || '',
            service_date: item.service_date ? new Date(item.service_date) : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: new Decimal(item.quantity || 1),
            unit: item.unit,
            unit_price: new Decimal(item.unit_price || 0),
          })),
        });
      }

      const updatedEstimate = await tx.estimates.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
        },
      });

      // Convert Decimal to number for the interface
      return {
        ...updatedEstimate,
        total_amount: Number(updatedEstimate.total_amount),
        tax_rate: updatedEstimate.tax_rate ? Number(updatedEstimate.tax_rate) : undefined,
        deposit_required: updatedEstimate.deposit_required ? Number(updatedEstimate.deposit_required) : undefined,
        items: updatedEstimate.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };
    });
  }

  async remove(inquiryId: number, id: number) {
    // First verify the estimate exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    return await this.prisma.estimates.delete({
      where: { id },
    });
  }

  async send(inquiryId: number, id: number) {
    // First verify the estimate exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    const updatedEstimate = await this.prisma.estimates.update({
      where: { id },
      data: {
        status: 'Sent',
        // Note: There's no sent_at field in the estimate schema, but we update status
      },
      include: {
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unit_price: true,
          },
        },
      },
    });

    // Convert Decimal to number for the interface
    return {
      ...updatedEstimate,
      total_amount: Number(updatedEstimate.total_amount),
      items: updatedEstimate.items.map(item => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };
  }
}
