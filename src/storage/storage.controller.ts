import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('buckets')
  async getBuckets() {
    return this.storageService.listBuckets();
  }

  @Post('buckets')
  async createBucket(@Body('name') name: string) {
    return this.storageService.createBucket(name);
  }

  @Post('buckets/:name/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('name') bucketName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadFile(
      bucketName,
      file.originalname,
      file.buffer,
    );
  }
}
