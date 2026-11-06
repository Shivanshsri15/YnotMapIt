import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RoutingService } from './routing.service.js';
import type { RouteBody, RouteResponse } from './routing.types.js';

@Controller('route')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  /**
   * Shortest-distance driving route between two coordinates.
   * Uses our TypeScript Dijkstra on the preloaded OSM graph (not an external routing API).
   */
  @Post()
  @HttpCode(200)
  calculateRoute(@Body() body: RouteBody): RouteResponse {
    return this.routingService.route({
      sourceLat: Number(body.sourceLat),
      sourceLon: Number(body.sourceLon),
      destLat: Number(body.destLat),
      destLon: Number(body.destLon),
    });
  }
}
