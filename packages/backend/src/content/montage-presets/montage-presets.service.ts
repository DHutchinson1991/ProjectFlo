import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { MontagePreset } from '@prisma/client';
import { CreateMontagePresetDto } from './dto/create-montage-preset.dto';
import { UpdateMontagePresetDto } from './dto/update-montage-preset.dto';

@Injectable()
export class MontagePresetsService {
    constructor(private prisma: PrismaService) {}

    private mapToResponseDto(preset: MontagePreset) {
        return {
            id: preset.id,
            brand_id: preset.brand_id,
            name: preset.name,
            min_duration_seconds: preset.min_duration_seconds,
            max_duration_seconds: preset.max_duration_seconds,
            is_system_seeded: preset.is_system_seeded,
            is_active: preset.is_active,
            created_at: preset.created_at,
            updated_at: preset.updated_at,
        };
    }

    async create(createDto: CreateMontagePresetDto) {
        if (createDto.min_duration_seconds > createDto.max_duration_seconds) {
            throw new BadRequestException('min_duration_seconds must be less than or equal to max_duration_seconds');
        }

        const preset = await this.prisma.montagePreset.create({
            data: {
                brand_id: createDto.brand_id ?? null,
                name: createDto.name,
                min_duration_seconds: createDto.min_duration_seconds,
                max_duration_seconds: createDto.max_duration_seconds,
                is_active: createDto.is_active ?? true,
            },
        });

        return this.mapToResponseDto(preset);
    }

    async findAll(brandId?: number) {
        const presets = await this.prisma.montagePreset.findMany({
            where: {
                OR: [
                    { brand_id: brandId ?? null },
                    { brand_id: null }, // always include system defaults
                ],
                is_active: true,
            },
            orderBy: { name: 'asc' },
        });

        return presets.map((p) => this.mapToResponseDto(p));
    }

    async findOne(id: number) {
        const preset = await this.prisma.montagePreset.findUnique({ where: { id } });
        if (!preset) {
            throw new NotFoundException(`MontagePreset with ID ${id} not found`);
        }
        return this.mapToResponseDto(preset);
    }

    async update(id: number, updateDto: UpdateMontagePresetDto) {
        const preset = await this.prisma.montagePreset.findUnique({ where: { id } });
        if (!preset) {
            throw new NotFoundException(`MontagePreset with ID ${id} not found`);
        }
        if (preset.is_system_seeded) {
            throw new BadRequestException('System-seeded presets cannot be modified');
        }

        const minDuration = updateDto.min_duration_seconds ?? preset.min_duration_seconds;
        const maxDuration = updateDto.max_duration_seconds ?? preset.max_duration_seconds;
        if (minDuration > maxDuration) {
            throw new BadRequestException('min_duration_seconds must be less than or equal to max_duration_seconds');
        }

        const updated = await this.prisma.montagePreset.update({
            where: { id },
            data: {
                name: updateDto.name,
                min_duration_seconds: updateDto.min_duration_seconds,
                max_duration_seconds: updateDto.max_duration_seconds,
                is_active: updateDto.is_active,
            },
        });

        return this.mapToResponseDto(updated);
    }

    async remove(id: number) {
        const preset = await this.prisma.montagePreset.findUnique({ where: { id } });
        if (!preset) {
            throw new NotFoundException(`MontagePreset with ID ${id} not found`);
        }
        if (preset.is_system_seeded) {
            throw new BadRequestException('System-seeded presets cannot be deleted');
        }

        await this.prisma.montagePreset.delete({ where: { id } });
        return { message: `MontagePreset with ID ${id} deleted successfully` };
    }
}
