import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ContributorsModule } from "./contributors/contributors.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [ContributorsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
