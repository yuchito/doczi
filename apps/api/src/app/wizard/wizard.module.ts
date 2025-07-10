import { Module } from '@nestjs/common';
import { WizardService } from './wizard.service';
import { WizardController } from './wizard.controller';
import { PrismaService } from '../../prisma.service';
import { TemplatesModule } from '../templates/templates.module'; // adjust path


@Module({
    imports: [TemplatesModule],
    providers: [WizardService, PrismaService],
    controllers: [WizardController],
})
export class WizardModule {}
