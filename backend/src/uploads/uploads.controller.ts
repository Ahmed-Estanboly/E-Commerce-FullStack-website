import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
const UPLOAD_DIR = join(process.cwd(), 'uploads');
const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const MAX_BYTES = 5 * 1024 * 1024;

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('master admin', 'branch owner', 'central owner', 'south owner')
export class UploadsController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(ALLOWED.has(ext) ? null : new BadRequestException('Only image files are allowed.'), ALLOWED.has(ext));
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    return { url: `/uploads/${file.filename}` };
  }
}
