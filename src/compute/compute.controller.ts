import { Controller, Post, Put, Body, Param } from '@nestjs/common';
import { ComputeService } from './compute.service';

@Controller('compute')
export class ComputeController {
  constructor(private readonly computeService: ComputeService) {}

  @Post('create')
  async create(@Body() body: { name: string; cores: number; memory: number; password: string }) {
    return this.computeService.createInstance(
      body.name,
      body.cores,
      body.memory,
      body.password,
    );
  }

  @Put(':id/update')
  async update(
    @Param('id') id: number,
    @Body() body: { cores: number; memory: number },
  ) {
    return this.computeService.updateInstance(id, body.cores, body.memory);
  }
}
