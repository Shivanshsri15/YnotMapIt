import { BadRequestException } from '@nestjs/common';
import type { GraphEdge, GraphNode, SnappedNode } from '../graph/graph.types.js';

/**
 * If the nearest road vertex is farther than this, the point is probably
 * outside the loaded region (or far from any driveable road).
 */
export const MAX_SNAP_DISTANCE_METRES = 500;

/** Basic geographic sanity checks before we touch the graph. */
export const assertValidCoordinate = (
  latitude: number,
  longitude: number,
  label: string,
): void => {
  const isNumber =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  if (!isNumber) {
    throw new BadRequestException(`${label} lat/lon must be numbers`);
  }

  const latitudeInRange = latitude >= -90 && latitude <= 90;
  const longitudeInRange = longitude >= -180 && longitude <= 180;
  if (!latitudeInRange || !longitudeInRange) {
    throw new BadRequestException(
      `${label} lat/lon out of valid geographic range`,
    );
  }
};

/** Ensure the clicked point landed close enough to a real road vertex. */
export const assertSnapIsCloseEnough = (
  snappedNode: SnappedNode,
  endpointLabel: string,
): void => {
  if (snappedNode.distanceM <= MAX_SNAP_DISTANCE_METRES) {
    return;
  }

  throw new BadRequestException(
    `${endpointLabel} is ${snappedNode.distanceM.toFixed(1)} m from the nearest road ` +
      `(max ${MAX_SNAP_DISTANCE_METRES} m). Use coordinates inside the loaded region.`,
  );
};

/**
 * Turn an ordered list of graph node ids into a drawable lat/lon polyline.
 * Prefers each edge's stored geometry (follows road bends) over straight lines.
 */
export const buildRoutePolyline = (
  nodeIdPath: string[],
  getNode: (nodeId: string) => GraphNode | undefined,
  getOutgoingEdges: (nodeId: string) => GraphEdge[],
): [number, number][] => {
  if (nodeIdPath.length === 0) {
    return [];
  }

  if (nodeIdPath.length === 1) {
    const onlyNode = getNode(nodeIdPath[0]);
    return onlyNode ? [[onlyNode.lat, onlyNode.lon]] : [];
  }

  const routePolyline: [number, number][] = [];

  for (let index = 0; index < nodeIdPath.length - 1; index += 1) {
    const fromNodeId = nodeIdPath[index];
    const toNodeId = nodeIdPath[index + 1];

    const connectingEdge = getOutgoingEdges(fromNodeId).find(
      (edge) => edge.to === toNodeId,
    );

    if (!connectingEdge) {
      const fromNode = getNode(fromNodeId);
      if (fromNode) {
        routePolyline.push([fromNode.lat, fromNode.lon]);
      }
      continue;
    }

    // Skip the first point of later edges so shared intersections are not duplicated.
    const geometryStartIndex = index === 0 ? 0 : 1;
    for (
      let pointIndex = geometryStartIndex;
      pointIndex < connectingEdge.geometry.length;
      pointIndex += 1
    ) {
      const [latitude, longitude] = connectingEdge.geometry[pointIndex];
      routePolyline.push([latitude, longitude]);
    }
  }

  return routePolyline;
};

/** Walk predecessor pointers from target back to source, then reverse. */
export const reconstructNodePath = (
  previousNodeById: Map<string, string>,
  sourceNodeId: string,
  targetNodeId: string,
): string[] => {
  const path: string[] = [];
  let currentNodeId: string | undefined = targetNodeId;

  while (currentNodeId !== undefined) {
    path.push(currentNodeId);
    if (currentNodeId === sourceNodeId) {
      break;
    }
    currentNodeId = previousNodeById.get(currentNodeId);
  }

  path.reverse();
  return path;
};
