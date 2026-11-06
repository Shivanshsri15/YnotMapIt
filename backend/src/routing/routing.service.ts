import { Injectable, NotFoundException } from '@nestjs/common';
import { GraphService } from '../graph/graph.service.js';
import { dijkstra } from './dijkstra.js';
import {
  assertSnapIsCloseEnough,
  assertValidCoordinate,
  buildRoutePolyline,
} from './routing.helpers.js';
import type { RouteRequest, RouteResponse } from './routing.types.js';

/**
 * Orchestrates: validate coords → snap to graph → Dijkstra → polyline for the map.
 * Edge weights are road lengths in metres (distance only, no traffic/time).
 */
@Injectable()
export class RoutingService {
  constructor(private readonly graphService: GraphService) {}

  route = (request: RouteRequest): RouteResponse => {
    assertValidCoordinate(request.sourceLat, request.sourceLon, 'source');
    assertValidCoordinate(request.destLat, request.destLon, 'destination');

    // Map clicks rarely sit exactly on a vertex — snap each end to the nearest intersection.
    const snappedSource = this.graphService.findNearestNode(
      request.sourceLat,
      request.sourceLon,
    );
    const snappedDestination = this.graphService.findNearestNode(
      request.destLat,
      request.destLon,
    );

    assertSnapIsCloseEnough(snappedSource, 'Source');
    assertSnapIsCloseEnough(snappedDestination, 'Destination');

    // Dijkstra walks only directed outgoing edges (one-ways already respected in the JSON).
    const shortestPath = dijkstra(
      snappedSource.nodeId,
      snappedDestination.nodeId,
      (nodeId) => this.graphService.getOutgoingEdges(nodeId),
    );

    if (!shortestPath.found) {
      throw new NotFoundException(
        'No driving route exists between the snapped source and destination (disconnected or unreachable).',
      );
    }

    const routeCoordinates = buildRoutePolyline(
      shortestPath.nodePath,
      this.graphService.getNode,
      this.graphService.getOutgoingEdges,
    );
    const graphInfo = this.graphService.getInfo();

    return {
      distanceM: shortestPath.distanceM,
      distanceKm: shortestPath.distanceM / 1000,
      coordinates: routeCoordinates,
      source: {
        requested: { lat: request.sourceLat, lon: request.sourceLon },
        snapped: snappedSource,
      },
      destination: {
        requested: { lat: request.destLat, lon: request.destLon },
        snapped: snappedDestination,
      },
      stats: {
        nodesExplored: shortestPath.stats.nodesExplored,
        edgesEvaluated: shortestPath.stats.edgesEvaluated,
        algorithmExecutionTimeMs: shortestPath.stats.executionTimeMs,
        nodePathLength: shortestPath.nodePath.length,
      },
      attribution: graphInfo.attribution,
    };
  };
}
