import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Put,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller()
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  @Get('buckets')
  async getBuckets() {
    return this.storageService.listBuckets();
  }



  @Put(':bucketname')
  async createBucketPut(@Param('bucketname') bucketname: string) {
    return this.storageService.createBucket(bucketname);
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
