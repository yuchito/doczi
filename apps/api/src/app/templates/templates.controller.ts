import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UPLOADS_PATH } from '../constants';

@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) {}

    @Post("/upload")
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: UPLOADS_PATH,
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                const allowed = ['.pdf', '.doc', '.docx', '.psd'];
                if (!allowed.includes(extname(file.originalname).toLowerCase())) {
                    return cb(new Error('Unsupported file type'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 10 * 1024 * 1024 }, // max 10 MB
        }),
    )
    create(
        @UploadedFile() file: Express.Multer.File,
        @Body() createTemplateDto: CreateTemplateDto,
    ) {
        if (!file) throw new Error('File is required');
        // Pass relative file path to service, for example "uploads/templates/filename.ext"
        const filePath = `uploads/templates/${file.filename}`;
        return this.templatesService.create({ ...createTemplateDto, filePath });
    }

    @Get()
    findAll() {
        return this.templatesService.findAll();
    }

    // IDs are UUID strings, so do NOT parseInt
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.templatesService.findOne(id);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
    async updateTemplate(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {
        return this.templatesService.update(id, {
            ...body,
            file: file?.buffer,
        });
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.templatesService.remove(id);
    }
}
