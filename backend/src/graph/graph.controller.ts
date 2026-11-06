import { Controller, Get } from '@nestjs/common';
import { GraphService } from './graph.service.js';
import type { GraphInfo } from './graph.types.js';

@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  /** Inspect the loaded road-network graph (counts, bbox, attribution). */
  @Get('info')
  getInfo(): GraphInfo {
    return this.graphService.getInfo();
  }
}
