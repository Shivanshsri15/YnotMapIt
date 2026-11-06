import type { GraphEdge } from '../graph/graph.types.js';
import { MinHeap } from './min-heap.js';
import { reconstructNodePath } from './routing.helpers.js';
import type { DijkstraResult, DijkstraStats } from './routing.types.js';

export type {
  DijkstraFailure,
  DijkstraResult,
  DijkstraStats,
  DijkstraSuccess,
} from './routing.types.js';

/**
 * Classic Dijkstra on a directed, non-negative weighted graph.
 * `getOutgoing(u)` must return only legally traversable edges (one-ways preserved).
 */
export function dijkstra(
  sourceId: string,
  targetId: string,
  getOutgoing: (nodeId: string) => GraphEdge[],
): DijkstraResult {
  const started = performance.now();
  let nodesExplored = 0;
  let edgesEvaluated = 0;

  if (sourceId === targetId) {
    return {
      found: true,
      nodePath: [sourceId],
      distanceM: 0,
      stats: {
        nodesExplored: 1,
        edgesEvaluated: 0,
        executionTimeMs: performance.now() - started,
      },
    };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const settled = new Set<string>();
  const heap = new MinHeap<string>();

  dist.set(sourceId, 0);
  heap.push(0, sourceId);

  while (heap.size > 0) {
    const current = heap.pop()!;
    const u = current.value;

    if (settled.has(u)) {
      continue;
    }
    settled.add(u);
    nodesExplored += 1;

    if (u === targetId) {
      break;
    }

    const du = dist.get(u);
    if (du === undefined) {
      continue;
    }

    for (const edge of getOutgoing(u)) {
      edgesEvaluated += 1;
      const v = edge.to;
      if (settled.has(v)) {
        continue;
      }
      const alt = du + edge.lengthM;
      const known = dist.get(v);
      if (known === undefined || alt < known) {
        dist.set(v, alt);
        prev.set(v, u);
        heap.push(alt, v);
      }
    }
  }

  const executionTimeMs = performance.now() - started;
  const stats: DijkstraStats = { nodesExplored, edgesEvaluated, executionTimeMs };

  if (!dist.has(targetId)) {
    return { found: false, stats };
  }

  const nodePath = reconstructNodePath(prev, sourceId, targetId);
  return {
    found: true,
    nodePath,
    distanceM: dist.get(targetId)!,
    stats,
  };
}
