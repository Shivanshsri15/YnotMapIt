import type { SnappedNode } from '../graph/graph.types.js';

/** Incoming JSON body for POST /route (fields may be missing until validated). */
export interface RouteBody {
  sourceLat?: number;
  sourceLon?: number;
  destLat?: number;
  destLon?: number;
}

/** Validated coordinates passed into RoutingService.route. */
export interface RouteRequest {
  sourceLat: number;
  sourceLon: number;
  destLat: number;
  destLon: number;
}

/** One endpoint of a route: what the user asked for vs where we snapped on the graph. */
export interface RouteEndpoint {
  requested: { lat: number; lon: number };
  snapped: SnappedNode;
}

/** API response for a successful shortest-distance drive route. */
export interface RouteResponse {
  distanceM: number;
  distanceKm: number;
  /** Route shape for the map: sequence of [latitude, longitude] points. */
  coordinates: [number, number][];
  source: RouteEndpoint;
  destination: RouteEndpoint;
  stats: {
    nodesExplored: number;
    edgesEvaluated: number;
    algorithmExecutionTimeMs: number;
    nodePathLength: number;
  };
  attribution: string;
}

/** Counters collected while Dijkstra runs. */
export interface DijkstraStats {
  nodesExplored: number;
  edgesEvaluated: number;
  executionTimeMs: number;
}

export interface DijkstraSuccess {
  found: true;
  nodePath: string[];
  distanceM: number;
  stats: DijkstraStats;
}

export interface DijkstraFailure {
  found: false;
  stats: DijkstraStats;
}

export type DijkstraResult = DijkstraSuccess | DijkstraFailure;

/** One entry in the Dijkstra priority queue. */
export interface HeapItem<T> {
  priority: number;
  value: T;
}
