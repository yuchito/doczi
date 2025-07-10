import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
    constructor(private prisma: PrismaService) {}

    async create(createDto: CreateTemplateDto & { filePath: string }) {
        // Save the filePath and other fields
        return this.prisma.template.create({
            data: {
                name: createDto.name,
                description: createDto.description,
                type: createDto.type,
                filePath: createDto.filePath,
            },
        });
    }

    async findAll() {
        return this.prisma.template.findMany();
    }

    async findOne(id: string) {
        const template = await this.prisma.template.findUnique({ where: { id } });
        if (!template) throw new NotFoundException(`Template #${id} not found`);
        return template;
    }

    async update(id: string, updateDto: Partial<CreateTemplateDto>) {
        return this.prisma.template.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        return this.prisma.template.delete({ where: { id } });
    }
}
