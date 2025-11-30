import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Minio from 'minio';
import { Stream } from 'stream';

interface MinioError extends Error {
  code?: string;
}

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: '192.168.137.102', // Your MinIO IP
      port: 9000,
      useSSL: false,
      accessKey: 'admin',
      secretKey: 'skar7777',
    });
  }

  // --- Fetch All Buckets ---
  async listBuckets() {
    try {
      return await this.minioClient.listBuckets();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  // --- Create Bucket ---
  async createBucket(bucketName: string) {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (exists) {
        throw new HttpException('Bucket already exists', HttpStatus.CONFLICT);
      }
      await this.minioClient.makeBucket(bucketName);
      return { message: `Bucket '${bucketName}' created successfully` };
    } catch (error) {
      const minioError = error as MinioError;
      throw new HttpException(
        minioError.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- Upload File (Update Bucket) ---
  async uploadFile(bucketName: string, fileName: string, fileBuffer: Buffer) {
    try {
      await this.minioClient.putObject(bucketName, fileName, fileBuffer);
      return { message: `File '${fileName}' uploaded to '${bucketName}'` };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
