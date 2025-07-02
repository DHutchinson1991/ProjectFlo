import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentCategoriesController } from './content-categories.controller';
import { ContentServiceModule } from '../content-service/content.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    imports: [ContentServiceModule, CategoriesModule],
    controllers: [ContentController, ContentCategoriesController],
    exports: [],
})
export class ContentModule { }
