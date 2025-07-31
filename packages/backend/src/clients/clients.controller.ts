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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/clients.dto';

@Controller('api/clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Get()
    async findAll(@Headers('x-brand-context') brandId: string) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.clientsService.findAll(brandIdNum);
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) {
            throw new NotFoundException('Brand ID is required');
        }
        return this.clientsService.findOne(id, brandIdNum);
    }

    @Post()
    async create(
        @Body() createClientDto: CreateClientDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.clientsService.create(createClientDto, brandIdNum);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateClientDto: UpdateClientDto,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.clientsService.update(id, updateClientDto, brandIdNum);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Headers('x-brand-context') brandId: string,
    ) {
        const brandIdNum = parseInt(brandId);
        if (!brandIdNum) throw new NotFoundException('Brand ID is required');
        return this.clientsService.remove(id, brandIdNum);
    }
}
