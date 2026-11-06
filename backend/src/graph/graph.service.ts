import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NodeGridIndex } from './graph.helpers.js';
import type {
  GraphEdge,
  GraphInfo,
  GraphNode,
  RoadNetworkGraph,
  SnappedNode,
} from './graph.types.js';

const DEFAULT_GRAPH_FILE = path.join('data', 'noida-drive.json');

/**
 * Owns the prebuilt Noida road network in memory.
 *
 * Flow:
 * 1. On startup, read `data/noida-drive.json` (offline OSMnx export).
 * 2. Build a lat/lon grid index for fast nearest-node queries.
 * 3. Expose nodes/edges to Dijkstra and snapping helpers.
 */
@Injectable()
export class GraphService implements OnModuleInit {
  private readonly logger = new Logger(GraphService.name);

  /** Full road network loaded from disk. Null until startup finishes. */
  private roadNetwork: RoadNetworkGraph | null = null;

  /** Spatial index over node coordinates (built after JSON load). */
  private nodeGridIndex: NodeGridIndex | null = null;

  /** Absolute path of the JSON file that was loaded. */
  private graphFilePath = '';

  /**
   * Nest lifecycle hook: runs once when the module starts.
   * Override path with env `GRAPH_PATH` if needed.
   */
  onModuleInit = async (): Promise<void> => {
    const configuredPath = process.env.GRAPH_PATH;
    this.graphFilePath = configuredPath
      ? path.resolve(configuredPath)
      : path.resolve(process.cwd(), DEFAULT_GRAPH_FILE);

    this.logger.log(`Loading road network from ${this.graphFilePath}`);

    const fileContents = await readFile(this.graphFilePath, 'utf8');
    const roadNetwork = JSON.parse(fileContents) as RoadNetworkGraph;

    const hasRequiredSections =
      roadNetwork.meta && roadNetwork.nodes && roadNetwork.adjacency;
    if (!hasRequiredSections) {
      throw new Error(
        'Invalid road network file: expected meta, nodes, and adjacency',
      );
    }

    this.roadNetwork = roadNetwork;
    this.nodeGridIndex = new NodeGridIndex(
      roadNetwork.nodes,
      roadNetwork.meta.bbox,
    );

    this.logger.log(
      `Loaded ${roadNetwork.meta.nodeCount} nodes and ${roadNetwork.meta.edgeCount} edges (${roadNetwork.meta.region})`,
    );
    this.logger.log(
      `Built node grid index with ${this.nodeGridIndex.cellCount} occupied cells`,
    );
  };

  /** True after the JSON graph has been parsed into memory. */
  isLoaded = (): boolean => this.roadNetwork !== null;

  /** Summary used by GET /graph/info (counts, bbox, OSM attribution). */
  getInfo = (): GraphInfo => {
    const { meta } = this.getLoadedRoadNetwork();

    return {
      loaded: true,
      region: meta.region,
      networkType: meta.networkType,
      nodeCount: meta.nodeCount,
      edgeCount: meta.edgeCount,
      bbox: meta.bbox,
      attribution: meta.attribution,
      attributionUrl: meta.attributionUrl,
      sourcePath: this.graphFilePath,
    };
  };

  /** Look up one vertex by OSM/graph id. */
  getNode = (nodeId: string): GraphNode | undefined =>
    this.getLoadedRoadNetwork().nodes[nodeId];

  /**
   * Outgoing directed edges from a vertex.
   * Empty array means no legal departure (dead-end or unknown id).
   * One-way restrictions are already encoded: missing reverse edges are intentional.
   */
  getOutgoingEdges = (nodeId: string): GraphEdge[] =>
    this.getLoadedRoadNetwork().adjacency[nodeId] ?? [];

  /**
   * Snap an arbitrary map click to the closest intersection/vertex.
   * Uses the grid index so we only haversine a local candidate set.
   */
  findNearestNode = (latitude: number, longitude: number): SnappedNode => {
    const roadNetwork = this.getLoadedRoadNetwork();
    const gridIndex = this.nodeGridIndex;

    if (!gridIndex) {
      throw new ServiceUnavailableException('Node grid index is not ready');
    }

    const snappedNode = gridIndex.findNearestNode(
      latitude,
      longitude,
      roadNetwork.nodes,
    );

    if (!snappedNode) {
      throw new ServiceUnavailableException('Road network has no nodes');
    }

    return snappedNode;
  };

  /** Fail clearly if someone calls graph APIs before startup load completes. */
  private getLoadedRoadNetwork = (): RoadNetworkGraph => {
    if (!this.roadNetwork) {
      throw new ServiceUnavailableException('Road network is not loaded yet');
    }
    return this.roadNetwork;
  };
}
