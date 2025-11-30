import { Controller, Post, Put, Body, Param, Get } from '@nestjs/common';
import { ComputeService } from './compute.service';

@Controller('compute')
export class ComputeController {
  constructor(private readonly computeService: ComputeService) {}

  @Post('create')
  async create(@Body() body: { hostname: string; cores: number }) {
    // Using default values for memory and password as they are not provided by the frontend
    return this.computeService.createInstance(
      body.hostname,
      body.cores,
      2048, // Default memory: 2048 MB
      'default-password', // Default password
    );
  }

  @Get('fetch')
  async fetch() {
    return this.computeService.fetchInstances();
  }

  @Put(':id/update')
  async update(
    @Param('id') id: number,
    @Body() body: { cores: number; memory: number },
  ) {
    return this.computeService.updateInstance(id, body.cores, body.memory);
  }

  @Post(':vmid/start')
  async start(@Param('vmid') vmid: number) {
    return this.computeService.startInstance(vmid);
  }

  @Post(':vmid/stop')
  async stop(@Param('vmid') vmid: number) {
    return this.computeService.stopInstance(vmid);
  }
}
