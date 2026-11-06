import { describe, expect, it } from 'vitest';
import type { GraphEdge } from '../graph/graph.types.js';
import { dijkstra } from './dijkstra.js';

/** Tiny directed graph matching the Step 1 teaching example. */
function toyOutgoing(id: string): GraphEdge[] {
  const edges: Record<string, GraphEdge[]> = {
    A: [
      { to: 'B', lengthM: 100, geometry: [] },
      { to: 'C', lengthM: 200, geometry: [] },
    ],
    B: [{ to: 'C', lengthM: 50, geometry: [] }],
    C: [],
  };
  return edges[id] ?? [];
}

describe('dijkstra', () => {
  it('finds the shorter A→B→C path (150) over direct A→C (200)', () => {
    const result = dijkstra('A', 'C', toyOutgoing);
    expect(result.found).toBe(true);
    if (!result.found) return;
    expect(result.distanceM).toBe(150);
    expect(result.nodePath).toEqual(['A', 'B', 'C']);
    expect(result.stats.nodesExplored).toBeGreaterThan(0);
    expect(result.stats.edgesEvaluated).toBeGreaterThan(0);
  });

  it('returns a trivial path when source equals target', () => {
    const result = dijkstra('A', 'A', toyOutgoing);
    expect(result.found).toBe(true);
    if (!result.found) return;
    expect(result.distanceM).toBe(0);
    expect(result.nodePath).toEqual(['A']);
  });

  it('reports not found for an unreachable node', () => {
    const result = dijkstra('C', 'A', toyOutgoing);
    expect(result.found).toBe(false);
  });
});
