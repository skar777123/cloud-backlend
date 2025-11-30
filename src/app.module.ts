import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ComputeModule } from './compute/compute.module';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [ComputeModule, DatabaseModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
