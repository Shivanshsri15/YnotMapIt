export interface SnappedNode {
  nodeId: string;
  lat: number;
  lon: number;
  distanceM: number;
}

export interface RouteEndpoint {
  requested: { lat: number; lon: number };
  snapped: SnappedNode;
}

export interface RouteResponse {
  distanceM: number;
  distanceKm: number;
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

export interface RouteRequest {
  sourceLat: number;
  sourceLon: number;
  destLat: number;
  destLon: number;
}

export interface GraphInfo {
  loaded: boolean;
  region: string;
  networkType: string;
  nodeCount: number;
  edgeCount: number;
  attribution: string;
}
