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
      // Create the estimate
      const estimate = await tx.estimates.create({
        data: {
          inquiry_id: inquiryId,
          project_id: createEstimateDto.project_id || null,
          estimate_number: createEstimateDto.estimate_number,
          issue_date: new Date(createEstimateDto.issue_date),
          expiry_date: new Date(createEstimateDto.expiry_date),
          total_amount: new Decimal(totalAmount),
          status: createEstimateDto.status || 'Draft',
        },
      });

      // Create estimate items
      await Promise.all(
        createEstimateDto.items.map(item =>
          tx.estimate_items.create({
            data: {
              estimate_id: estimate.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: new Decimal(item.unit_price),
            },
          })
        )
      );

      // Return estimate with converted total_amount for Estimate interface
      return {
        ...estimate,
        total_amount: totalAmount,
      } as Estimate;
    });
  }

  async findAll(inquiryId: number) {
    const estimates = await this.prisma.estimates.findMany({
      where: { inquiry_id: inquiryId },
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
      orderBy: { created_at: 'desc' },
    });

    // Convert Decimal to number for the interface
    return estimates.map(estimate => ({
      ...estimate,
      total_amount: Number(estimate.total_amount),
      items: estimate.items.map(item => ({
        ...item,
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

    if (!estimate) {
      throw new NotFoundException(`Estimate with ID ${id} not found for inquiry ${inquiryId}`);
    }

    // Convert Decimal to number for the interface
    return {
      ...estimate,
      total_amount: Number(estimate.total_amount),
      items: estimate.items.map(item => ({
        ...item,
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
        project_id?: number | null;
        total_amount?: Decimal;
      } = {};

      if (updateEstimateDto.estimate_number) {
        updateData.estimate_number = updateEstimateDto.estimate_number;
      }
      if (updateEstimateDto.issue_date) {
        updateData.issue_date = new Date(updateEstimateDto.issue_date);
      }
      if (updateEstimateDto.expiry_date) {
        updateData.expiry_date = new Date(updateEstimateDto.expiry_date);
      }
      if (updateEstimateDto.status) {
        updateData.status = updateEstimateDto.status;
      }
      if (updateEstimateDto.project_id !== undefined) {
        updateData.project_id = updateEstimateDto.project_id;
      }
      if (totalAmount !== undefined) {
        updateData.total_amount = new Decimal(totalAmount);
      }

      const updatedEstimate = await tx.estimates.update({
        where: { id },
        data: updateData,
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
