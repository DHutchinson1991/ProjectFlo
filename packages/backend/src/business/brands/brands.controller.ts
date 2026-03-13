import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Put,
    Param,
    Delete,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandSettingDto } from './dto/create-brand-setting.dto';
import { UpdateBrandSettingDto } from './dto/update-brand-setting.dto';
import { AddUserToBrandDto } from './dto/add-user-to-brand.dto';

@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Post()
    create(@Body() createBrandDto: CreateBrandDto) {
        return this.brandsService.create(createBrandDto);
    }

    @Get()
    findAll() {
        return this.brandsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.brandsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateBrandDto: UpdateBrandDto) {
        return this.brandsService.update(id, updateBrandDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.brandsService.remove(id);
    }

    // User-Brand relationship endpoints
    @Post(':brandId/users/:userId')
    addUserToBrand(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body() addUserDto: AddUserToBrandDto,
    ) {
        return this.brandsService.addUserToBrand(brandId, userId, addUserDto);
    }

    @Get('users/:userId/brands')
    getUserBrands(@Param('userId', ParseIntPipe) userId: number) {
        return this.brandsService.getUserBrands(userId);
    }

    @Delete(':brandId/users/:userId')
    removeUserFromBrand(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.brandsService.removeUserFromBrand(brandId, userId);
    }

    // Brand Settings endpoints
    @Post(':brandId/settings')
    createSetting(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Body() createSettingDto: CreateBrandSettingDto,
    ) {
        return this.brandsService.createSetting(brandId, createSettingDto);
    }

    @Get(':brandId/settings')
    getSettings(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Query('category') category?: string,
    ) {
        return this.brandsService.getSettings(brandId, category);
    }

    @Get(':brandId/settings/:key')
    getSetting(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('key') key: string,
    ) {
        return this.brandsService.getSetting(brandId, key);
    }

    @Patch(':brandId/settings/:key')
    updateSetting(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('key') key: string,
        @Body() updateSettingDto: UpdateBrandSettingDto,
    ) {
        return this.brandsService.updateSetting(brandId, key, updateSettingDto);
    }

    @Delete(':brandId/settings/:key')
    deleteSetting(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('key') key: string,
    ) {
        return this.brandsService.deleteSetting(brandId, key);
    }

    // Meeting Settings (batch get/save)
    @Get(':brandId/meeting-settings')
    getMeetingSettings(@Param('brandId', ParseIntPipe) brandId: number) {
        return this.brandsService.getMeetingSettings(brandId);
    }

    @Put(':brandId/meeting-settings')
    upsertMeetingSettings(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Body() body: {
            duration_minutes?: number;
            description?: string;
            available_days?: number[];
            available_from?: string;
            available_to?: string;
            google_meet_link?: string;
        },
    ) {
        return this.brandsService.upsertMeetingSettings(brandId, body);
    }

    // Brand context endpoints
    @Get(':brandId/context/users/:userId')
    getBrandContext(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.brandsService.getBrandContext(userId, brandId);
    }

    @Post(':brandId/context/users/:userId/switch')
    switchBrandContext(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.brandsService.switchBrandContext(userId, brandId);
    }
}
