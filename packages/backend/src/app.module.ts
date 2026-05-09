import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
// Platform Domain
import { PlatformModule } from "./platform/platform.module";
// Content Domain
import { ContentModule } from './content/content.module';
// Catalog Domain
import { CatalogModule } from './catalog/catalog.module';
// Workflow Domain
import { WorkflowModule } from './workflow/workflow.module';
// Finance Domain
import { FinanceModule } from './finance/finance.module';
// AI Domain
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    EventEmitterModule.forRoot(),
    // Platform bucket (auth, users, brands, prisma, logging, activity-logs)
    PlatformModule,
    // Content bucket
    ContentModule,
    // Catalog bucket
    CatalogModule,
    // Workflow bucket
    WorkflowModule,
    // Finance bucket
    FinanceModule,
    // AI bucket (experimental)
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
