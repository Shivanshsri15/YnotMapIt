/** NestJS contract matching backend/data/noida-drive.json (from data-prep). */

export interface GraphBBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

export interface GraphMeta {
  region: string;
  networkType: string;
  crs: string;
  generatedAt: string;
  attribution: string;
  attributionUrl: string;
  nodeCount: number;
  edgeCount: number;
  bbox: GraphBBox;
  downloadSource?: string;
  nodesBeforeComponentFilter?: number;
  edgesBeforeComponentFilter?: number;
}

export interface GraphNode {
  lat: number;
  lon: number;
}

export interface GraphEdge {
  to: string;
  lengthM: number;
  geometry: [number, number][]; // [lat, lon]
}

export interface RoadNetworkGraph {
  meta: GraphMeta;
  nodes: Record<string, GraphNode>;
  adjacency: Record<string, GraphEdge[]>;
}

export interface GraphInfo {
  loaded: boolean;
  region: string;
  networkType: string;
  nodeCount: number;
  edgeCount: number;
  bbox: GraphBBox;
  attribution: string;
  attributionUrl: string;
  sourcePath: string;
}

/** Result of snapping a free lat/lon to the closest road-network vertex. */
export interface SnappedNode {
  nodeId: string;
  lat: number;
  lon: number;
  /** Straight-line distance from the requested point to this vertex (metres). */
  distanceM: number;
}
