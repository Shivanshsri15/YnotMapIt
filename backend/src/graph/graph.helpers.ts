import type { GraphBBox, GraphNode, SnappedNode } from './graph.types.js';

/** Mean Earth radius used by the haversine distance formula (metres). */
const EARTH_RADIUS_METRES = 6_371_000;

/**
 * Default cell size in degrees (~1.1 km at the equator).
 * Smaller cells → fewer candidates per query, more buckets in memory.
 */
export const DEFAULT_GRID_CELL_SIZE_DEGREES = 0.01;

/** Converts degrees to radians (Math trig functions expect radians). */
export const degreesToRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two geographic points (haversine formula).
 * Used for nearest-vertex snapping — not as Dijkstra edge weights.
 */
export const distanceBetweenPointsMetres = (
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number => {
  const latitudeDelta = degreesToRadians(toLatitude - fromLatitude);
  const longitudeDelta = degreesToRadians(toLongitude - fromLongitude);

  const fromLatitudeRadians = degreesToRadians(fromLatitude);
  const toLatitudeRadians = degreesToRadians(toLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(haversine));
};

/**
 * Among a candidate id list, return the node closest to (latitude, longitude).
 */
export const findClosestNodeAmongCandidates = (
  latitude: number,
  longitude: number,
  candidateNodeIds: readonly string[],
  nodesById: Record<string, GraphNode>,
): SnappedNode | null => {
  let nearestNodeId = '';
  let nearestLatitude = 0;
  let nearestLongitude = 0;
  let nearestDistanceMetres = Number.POSITIVE_INFINITY;

  for (const nodeId of candidateNodeIds) {
    const node = nodesById[nodeId];
    if (!node) {
      continue;
    }

    const distanceMetres = distanceBetweenPointsMetres(
      latitude,
      longitude,
      node.lat,
      node.lon,
    );

    if (distanceMetres < nearestDistanceMetres) {
      nearestDistanceMetres = distanceMetres;
      nearestNodeId = nodeId;
      nearestLatitude = node.lat;
      nearestLongitude = node.lon;
    }
  }

  if (!nearestNodeId) {
    return null;
  }

  return {
    nodeId: nearestNodeId,
    lat: nearestLatitude,
    lon: nearestLongitude,
    distanceM: nearestDistanceMetres,
  };
};

/**
 * Spatial grid over the graph bounding box.
 *
 * Built once at startup: each node is placed in a cell.
 * Queries only scan the click cell + neighbouring cells (expanding rings if empty),
 * then haversine picks the true nearest among that shortlist.
 */
export class NodeGridIndex {
  private readonly cells = new Map<string, string[]>();
  private readonly minLatitude: number;
  private readonly minLongitude: number;
  private readonly cellSizeDegrees: number;
  private readonly rowCount: number;
  private readonly columnCount: number;

  constructor(
    nodesById: Record<string, GraphNode>,
    boundingBox: GraphBBox,
    cellSizeDegrees: number = DEFAULT_GRID_CELL_SIZE_DEGREES,
  ) {
    this.minLatitude = boundingBox.minLat;
    this.minLongitude = boundingBox.minLon;
    this.cellSizeDegrees = cellSizeDegrees;

    const latitudeSpan = Math.max(
      boundingBox.maxLat - boundingBox.minLat,
      cellSizeDegrees,
    );
    const longitudeSpan = Math.max(
      boundingBox.maxLon - boundingBox.minLon,
      cellSizeDegrees,
    );

    this.rowCount = Math.max(1, Math.ceil(latitudeSpan / cellSizeDegrees));
    this.columnCount = Math.max(1, Math.ceil(longitudeSpan / cellSizeDegrees));

    for (const [nodeId, node] of Object.entries(nodesById)) {
      const { row, column } = this.coordinatesToCell(node.lat, node.lon);
      const cellKey = this.toCellKey(row, column);
      const bucket = this.cells.get(cellKey);
      if (bucket) {
        bucket.push(nodeId);
      } else {
        this.cells.set(cellKey, [nodeId]);
      }
    }
  }

  get cellCount(): number {
    return this.cells.size;
  }

  /**
   * Nearest node to a query point, using the grid to limit candidates.
   * Falls back to scanning every node id if the grid somehow yields nothing.
   */
  findNearestNode = (
    latitude: number,
    longitude: number,
    nodesById: Record<string, GraphNode>,
  ): SnappedNode | null => {
    const candidateNodeIds = this.collectCandidateNodeIds(latitude, longitude);

    const fromGrid = findClosestNodeAmongCandidates(
      latitude,
      longitude,
      candidateNodeIds,
      nodesById,
    );
    if (fromGrid) {
      return fromGrid;
    }

    // Safety net: empty graph or pathological bbox — scan all ids.
    return findClosestNodeAmongCandidates(
      latitude,
      longitude,
      Object.keys(nodesById),
      nodesById,
    );
  };

  /**
   * Gather node ids around the query cell.
   *
   * Always starts with a 3×3 neighbourhood (ring radius 1) so a closer node
   * just across a cell border is not missed. If that is empty (sparse area /
   * outside coverage), expand the ring until we find candidates.
   */
  private collectCandidateNodeIds = (
    latitude: number,
    longitude: number,
  ): string[] => {
    const { row: centerRow, column: centerColumn } = this.coordinatesToCell(
      latitude,
      longitude,
    );

    const maxRing = Math.max(this.rowCount, this.columnCount);

    for (let ringRadius = 1; ringRadius <= maxRing; ringRadius += 1) {
      const candidateNodeIds = this.collectNodesInRing(
        centerRow,
        centerColumn,
        ringRadius,
      );
      if (candidateNodeIds.length > 0) {
        return candidateNodeIds;
      }
    }

    return [];
  };

  /** All node ids in the inclusive square of cells within `ringRadius` of center. */
  private collectNodesInRing = (
    centerRow: number,
    centerColumn: number,
    ringRadius: number,
  ): string[] => {
    const candidateNodeIds: string[] = [];

    for (let row = centerRow - ringRadius; row <= centerRow + ringRadius; row += 1) {
      for (
        let column = centerColumn - ringRadius;
        column <= centerColumn + ringRadius;
        column += 1
      ) {
        if (!this.isCellInGrid(row, column)) {
          continue;
        }

        const bucket = this.cells.get(this.toCellKey(row, column));
        if (bucket) {
          candidateNodeIds.push(...bucket);
        }
      }
    }

    return candidateNodeIds;
  };

  private coordinatesToCell = (
    latitude: number,
    longitude: number,
  ): { row: number; column: number } => {
    const rawRow = Math.floor(
      (latitude - this.minLatitude) / this.cellSizeDegrees,
    );
    const rawColumn = Math.floor(
      (longitude - this.minLongitude) / this.cellSizeDegrees,
    );

    // Clamp so points slightly outside the bbox still map to an edge cell.
    const row = Math.min(Math.max(rawRow, 0), this.rowCount - 1);
    const column = Math.min(Math.max(rawColumn, 0), this.columnCount - 1);

    return { row, column };
  };

  private isCellInGrid = (row: number, column: number): boolean =>
    row >= 0 && row < this.rowCount && column >= 0 && column < this.columnCount;

  private toCellKey = (row: number, column: number): string =>
    `${row}:${column}`;
}
