import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PrismaService } from './prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcryptjs';
import { existsSync, mkdirSync } from 'fs';
import { UPLOADS_PATH } from './app/constants';

async function bootstrap() {
  // create app as NestExpressApplication for static assets & cors
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  // prisma setup - create admin user if not exist
  const prisma = app.get(PrismaService);
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });
  if (!existing) {
    const hashed = await bcrypt.hash('1234', 10);
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashed,
      },
    });
    console.log('Admin user created: admin@example.com / 1234');
  }

  if (!existsSync(UPLOADS_PATH)) {
    mkdirSync(UPLOADS_PATH, { recursive: true });
  }

  app.useStaticAssets(UPLOADS_PATH, {
    prefix: '/templates/files/',
  });

  // listen on env PORT or 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
