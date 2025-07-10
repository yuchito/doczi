import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from "./auth/auth.module";
import { PrismaService } from "../prisma.service";
import { WizardModule } from "./wizard/wizard.module";
import { TemplatesModule } from "./templates/templates.module";

@Module({
  imports: [AuthModule, WizardModule, TemplatesModule,],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
