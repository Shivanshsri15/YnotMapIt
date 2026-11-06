import { describe, expect, it } from 'vitest';
import {
  NodeGridIndex,
  distanceBetweenPointsMetres,
  findClosestNodeAmongCandidates,
} from './graph.helpers.js';
import type { GraphBBox, GraphNode } from './graph.types.js';

describe('graph.helpers', () => {
  const boundingBox: GraphBBox = {
    minLat: 28.5,
    minLon: 77.3,
    maxLat: 28.6,
    maxLon: 77.4,
  };

  const nodesById: Record<string, GraphNode> = {
    farWest: { lat: 28.51, lon: 77.31 },
    nearClick: { lat: 28.55, lon: 77.35 },
    farEast: { lat: 28.59, lon: 77.39 },
  };

  it('measures zero distance for identical points', () => {
    expect(distanceBetweenPointsMetres(28.55, 77.35, 28.55, 77.35)).toBe(0);
  });

  it('picks the closest candidate by haversine', () => {
    const snapped = findClosestNodeAmongCandidates(
      28.5501,
      77.3501,
      Object.keys(nodesById),
      nodesById,
    );

    expect(snapped?.nodeId).toBe('nearClick');
  });

  it('grid index returns the same nearest node as a full scan', () => {
    const gridIndex = new NodeGridIndex(nodesById, boundingBox, 0.02);
    const queryLatitude = 28.5502;
    const queryLongitude = 77.3502;

    const fromGrid = gridIndex.findNearestNode(
      queryLatitude,
      queryLongitude,
      nodesById,
    );
    const fromFullScan = findClosestNodeAmongCandidates(
      queryLatitude,
      queryLongitude,
      Object.keys(nodesById),
      nodesById,
    );

    expect(fromGrid?.nodeId).toBe(fromFullScan?.nodeId);
    expect(fromGrid?.nodeId).toBe('nearClick');
    expect(gridIndex.cellCount).toBeGreaterThan(0);
  });

  it('still finds a closer node in a neighbouring cell (3×3 search)', () => {
    // Tiny cells so these two nodes fall in different buckets.
    const borderNodes: Record<string, GraphNode> = {
      inClickCell: { lat: 28.5500, lon: 77.3500 },
      acrossBorder: { lat: 28.5500, lon: 77.35005 },
    };
    const gridIndex = new NodeGridIndex(borderNodes, boundingBox, 0.00004);

    // Click sits in inClickCell's bucket but is physically closer to acrossBorder.
    const snapped = gridIndex.findNearestNode(28.5500, 77.35004, borderNodes);

    expect(snapped?.nodeId).toBe('acrossBorder');
  });
});
