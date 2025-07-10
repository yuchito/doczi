import { Controller, Post, Get, UploadedFile, UseInterceptors, UseGuards, Body, Res, NotFoundException, Param, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import csvParser from 'csv-parser';

import { Readable } from 'stream';
import { AuthGuard } from '@nestjs/passport';
import { TemplatesService } from '../templates/templates.service';
import { Response } from 'express';
import { readFileSync } from 'fs';
import PizZip from 'pizzip';
import DocxTemplater from 'docxtemplater';
import { join } from 'path';
import JSZip from 'jszip';

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    grade: string;
}

@Controller('wizard')
@UseGuards(AuthGuard('jwt'))
export class WizardController {
    private students: Student[] = [];

  constructor(private readonly templatesService: TemplatesService) {}

  @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(@UploadedFile() file: Express.Multer.File) {
        if (!file) return { message: 'No file uploaded' };

        this.students = [];
        await new Promise((resolve, reject) => {
            const stream = Readable.from(file.buffer);
            stream
                .pipe(csvParser())
                .on('data', (data) => {
                    this.students.push({
                        id: Math.random().toString(36).slice(2, 9),
                        firstName: data.first_name,
                        lastName: data.last_name,
                        email: data.email,
                        grade: data.grade,
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        return { message: 'Upload successful', count: this.students.length };
    }

    @Get()
    getStudents() {
        return this.students;
    }

  private generateDocx(templatePath: string, data: any): Buffer {
    const content = readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new DocxTemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    return doc.getZip().generate({ type: 'nodebuffer' });
  }

  @Post('generate-one')
  async generateOne(
    @Body() body: Partial<Student> & { docType: string },
    @Res() res: Response,
  ) {
    const student = {
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      email: body.email || '',
      grade: body.grade || '',
    };

    // Fetch template by docType (assuming docType === template id)
    const template = await this.templatesService.findOne(body.docType);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.filePath) {
      throw new NotFoundException('Template file not found');
    }

    // Generate docx file with replaced placeholders
    const docBuffer = this.generateDocx(template.filePath, student);

    // Set headers for download
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${student.firstName}_${student.lastName}_${template.name}.docx"`,
      'Content-Length': docBuffer.length,
    });

    // Send file buffer as response
    return res.send(docBuffer);
  }

  @Get('download-one/:studentId')
  async downloadOne(
    @Param('studentId') studentId: string,
    @Query('docType') docType: string,
    @Res() res: Response,
  ) {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) throw new NotFoundException('Student not found');

    if (!docType) throw new NotFoundException('docType query param required');
    const template = await this.templatesService.findOne(docType);
    if (!template) throw new NotFoundException('Template not found');
    if (!template.filePath) throw new NotFoundException('Template file not found');

    const templatePath = join(process.cwd(), template.filePath);
    const docBuffer = this.generateDocx(templatePath, student);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${student.firstName}_${student.lastName}_${template.name}.docx"`,
      'Content-Length': docBuffer.length,
    });

    return res.send(docBuffer);
  }

  @Get('download-all')
  async downloadAll(@Query('docType') docType: string, @Res() res: Response) {
    if (!docType) throw new NotFoundException('docType query param required');
    const template = await this.templatesService.findOne(docType);
    if (!template) throw new NotFoundException('Template not found');
    if (!template.filePath) throw new NotFoundException('Template file not found');

    const templatePath = join(process.cwd(), template.filePath);
    const content = readFileSync(templatePath, 'binary');

    const zip = new JSZip();

    for (const student of this.students) {
      const zipTpl = new PizZip(content);
      const doc = new DocxTemplater(zipTpl, { paragraphLoop: true, linebreaks: true });
      doc.render(student);
      const buf = doc.getZip().generate({ type: 'nodebuffer' });

      zip.file(`${student.firstName}_${student.lastName}_${template.name}.docx`, buf);
    }

    const zippedBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=documents_bulk.zip',
      'Content-Length': zippedBuffer.length,
    });

    return res.send(zippedBuffer);
  }
}
