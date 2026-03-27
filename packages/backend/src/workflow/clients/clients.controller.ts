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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/clients.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    async findAll(@BrandId() brandId?: number) {
        if (!brandId) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.clientsService.findAll(brandId);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.clientsService.findOne(id, brandId);
    }

    @Post()
    async create(
        @Body(new ValidationPipe({ transform: true })) createClientDto: CreateClientDto,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new NotFoundException('Brand ID is required');
        return this.clientsService.create(createClientDto, brandId);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateClientDto: UpdateClientDto,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new NotFoundException('Brand ID is required');
        return this.clientsService.update(id, updateClientDto, brandId);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @BrandId() brandId?: number,
    ) {
        if (!brandId) throw new NotFoundException('Brand ID is required');
        return this.clientsService.remove(id, brandId);
    }
}
