import { Controller, Post, Body } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post('provision')
  async provision(@Body() body: { type: string; name: string }) {
    if (!body.type || !body.name) {
      return {
        error: "Please provide 'type' (mariadb/postgres/etc) and 'name'",
      };
    }
    return await this.dbService.createDatabase(body.type, body.name);
  }
}
