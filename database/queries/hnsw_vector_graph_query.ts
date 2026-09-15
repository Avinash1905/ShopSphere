import { ProductEmbeddingRepository } from '../repositories/product_embedding_repository.js';

export interface HNSWNode {
  id: string;
  vector: number[];
  layer: number;
  neighborsByLayer: Record<number, string[]>;
}

export interface HNSWSearchResult {
  id: string;
  distance: number;
  similarityScore: number;
}

export class HNSWVectorGraphQueryEngine {
  private nodes: Map<string, HNSWNode> = new Map();
  private entryPointId: string | null = null;
  private maxLayers: number;
  private maxNeighbors: number; // M
  private efSearch: number;

  constructor(maxLayers: number = 4, maxNeighbors: number = 16, efSearch: number = 32) {
    this.maxLayers = maxLayers;
    this.maxNeighbors = maxNeighbors;
    this.efSearch = efSearch;
  }

  /**
   * Calculates Euclidean distance between two vectors
   */
  public static euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Adds a vector node into the HNSW multi-layer graph
   */
  public addNode(id: string, vector: number[], targetLayer?: number): void {
    const layer = targetLayer !== undefined ? targetLayer : Math.floor(Math.random() * this.maxLayers);
    const node: HNSWNode = {
      id,
      vector,
      layer,
      neighborsByLayer: {},
    };

    for (let l = 0; l <= layer; l++) {
      node.neighborsByLayer[l] = [];
    }

    if (this.entryPointId === null) {
      this.entryPointId = id;
      this.nodes.set(id, node);
      return;
    }

    // Connect node to nearest neighbors on each layer
    for (const [existingId, existingNode] of this.nodes.entries()) {
      for (let l = 0; l <= Math.min(layer, existingNode.layer); l++) {
        if (node.neighborsByLayer[l].length < this.maxNeighbors) {
          node.neighborsByLayer[l].push(existingId);
        }
        if (existingNode.neighborsByLayer[l].length < this.maxNeighbors) {
          existingNode.neighborsByLayer[l].push(id);
        }
      }
    }

    this.nodes.set(id, node);
    if (layer > (this.nodes.get(this.entryPointId)?.layer || 0)) {
      this.entryPointId = id;
    }
  }

  /**
   * Searches the HNSW graph using multi-layer greedy routing
   */
  public searchKnn(queryVector: number[], k: number = 5): HNSWSearchResult[] {
    if (this.nodes.size === 0 || !this.entryPointId) {
      return [];
    }

    let currentId = this.entryPointId;
    const topLayer = this.nodes.get(this.entryPointId)!.layer;

    // 1. Traverse top layers greedily
    for (let l = topLayer; l > 0; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const currentNode = this.nodes.get(currentId)!;
        const currentDist = HNSWVectorGraphQueryEngine.euclideanDistance(queryVector, currentNode.vector);
        const neighbors = currentNode.neighborsByLayer[l] || [];

        for (const nId of neighbors) {
          const neighborNode = this.nodes.get(nId);
          if (neighborNode) {
            const dist = HNSWVectorGraphQueryEngine.euclideanDistance(queryVector, neighborNode.vector);
            if (dist < currentDist) {
              currentId = nId;
              changed = true;
              break;
            }
          }
        }
      }
    }

    // 2. Perform greedy search on bottom layer (layer 0)
    const visited = new Set<string>([currentId]);
    const candidates = [currentId];
    const results: Array<{ id: string; distance: number; sim: number }> = [];

    while (candidates.length > 0) {
      const curr = candidates.pop()!;
      const node = this.nodes.get(curr)!;
      const dist = HNSWVectorGraphQueryEngine.euclideanDistance(queryVector, node.vector);
      const sim = ProductEmbeddingRepository.cosineSimilarity(queryVector, node.vector);
      results.push({ id: curr, distance: dist, sim });

      const neighbors = node.neighborsByLayer[0] || [];
      for (const nId of neighbors) {
        if (!visited.has(nId)) {
          visited.add(nId);
          candidates.push(nId);
        }
      }

      if (results.length >= this.efSearch) break;
    }

    results.sort((a, b) => a.distance - b.distance);

    return results.slice(0, k).map(r => ({
      id: r.id,
      distance: Math.round(r.distance * 10000) / 10000,
      similarityScore: Math.round(r.sim * 10000) / 10000,
    }));
  }

  public size(): number {
    return this.nodes.size;
  }
}
