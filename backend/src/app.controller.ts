import { Controller, Get } from '@nestjs/common';
import { GraphService } from './graph/graph.service.js';

@Controller()
export class AppController {
  constructor(private readonly graphService: GraphService) {}

  @Get('health')
  health() {
    const loaded = this.graphService.isLoaded();
    return {
      status: loaded ? 'ok' : 'degraded',
      graphLoaded: loaded,
    };
  }
}
