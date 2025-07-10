import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class WizardService {
    constructor(private prisma: PrismaService) {}

    async createMany(students: { firstName: string; lastName: string; email: string; grade: number; }[]) {
        // Upsert multiple students, ignoring duplicates by email
        const result = await Promise.all(students.map(s =>
            this.prisma.student.upsert({
                where: { email: s.email },
                update: {},
                create: s,
            }),
        ));
        return result;
    }

    async findAll() {
        return this.prisma.student.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
}
