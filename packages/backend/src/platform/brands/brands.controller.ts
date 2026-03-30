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
    UseGuards,
    ValidationPipe,
    NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateBrandSettingDto } from './dto/create-brand-setting.dto';
import { UpdateBrandSettingDto } from './dto/update-brand-setting.dto';
import { AddUserToBrandDto } from './dto/add-user-to-brand.dto';
import { UpsertMeetingSettingsDto } from './dto/upsert-meeting-settings.dto';
import { UpsertWelcomeSettingsDto } from './dto/upsert-welcome-settings.dto';
import { BrandSettingsQueryDto } from './dto/brand-settings-query.dto';

@Controller('api/brands')
@UseGuards(AuthGuard('jwt'))
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    @Post()
    create(@Body(new ValidationPipe({ transform: true })) createBrandDto: CreateBrandDto) {
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
    update(@Param('id', ParseIntPipe) id: number, @Body(new ValidationPipe({ transform: true })) updateBrandDto: UpdateBrandDto) {
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
        @Body(new ValidationPipe({ transform: true })) addUserDto: AddUserToBrandDto,
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
        @Body(new ValidationPipe({ transform: true })) createSettingDto: CreateBrandSettingDto,
    ) {
        return this.brandsService.createSetting(brandId, createSettingDto);
    }

    @Get(':brandId/settings')
    getSettings(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Query(new ValidationPipe({ transform: true })) query: BrandSettingsQueryDto,
    ) {
        return this.brandsService.getSettings(brandId, query.category);
    }

    @Get(':brandId/settings/:key')
    async getSetting(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('key') key: string,
    ) {
        try {
            return await this.brandsService.getSetting(brandId, key);
        } catch (e) {
            if (e instanceof NotFoundException) return null;
            throw e;
        }
    }

    @Patch(':brandId/settings/:key')
    updateSetting(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Param('key') key: string,
        @Body(new ValidationPipe({ transform: true })) updateSettingDto: UpdateBrandSettingDto,
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
        @Body(new ValidationPipe({ transform: true })) dto: UpsertMeetingSettingsDto,
    ) {
        return this.brandsService.upsertMeetingSettings(brandId, dto);
    }

    // Welcome Page Settings (batch get/save)
    @Get(':brandId/welcome-settings')
    getWelcomeSettings(@Param('brandId', ParseIntPipe) brandId: number) {
        return this.brandsService.getWelcomeSettings(brandId);
    }

    @Put(':brandId/welcome-settings')
    upsertWelcomeSettings(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpsertWelcomeSettingsDto,
    ) {
        return this.brandsService.upsertWelcomeSettings(brandId, dto);
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
