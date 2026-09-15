export interface PickItemLocation {
  orderId: string;
  orderItemId: string;
  variantId: string;
  sku: string;
  quantity: number;
  binId: string;
  binCode: string;
  aisleIndex: number; // e.g. Aisle 1 = 1, Aisle 2 = 2
  rackPosition: number; // e.g. 1 to 20 along aisle
}

export interface OptimizedPickRoute {
  waveId: string;
  totalPickItems: number;
  totalUnitsToPick: number;
  distinctAislesTraversed: number;
  estimatedWalkingDistanceMeters: number;
  estimatedPickDurationMinutes: number;
  orderedPickSequence: PickItemLocation[];
  routingStrategy: 'S_SHAPE_HEURISTIC' | 'TSP_2_OPT';
}

export class WMSPickPackRoutingQueryEngine {
  /**
   * Optimizes picking path across warehouse aisles using S-Shape Aisle Traversal Heuristic
   */
  public static optimizePickWave(waveId: string, items: PickItemLocation[]): OptimizedPickRoute {
    if (items.length === 0) {
      return {
        waveId,
        totalPickItems: 0,
        totalUnitsToPick: 0,
        distinctAislesTraversed: 0,
        estimatedWalkingDistanceMeters: 0,
        estimatedPickDurationMinutes: 0,
        orderedPickSequence: [],
        routingStrategy: 'S_SHAPE_HEURISTIC',
      };
    }

    // Sort by aisle index, then serpentine zig-zag along racks (odd aisles ascending, even aisles descending)
    const sorted = [...items].sort((a, b) => {
      if (a.aisleIndex !== b.aisleIndex) {
        return a.aisleIndex - b.aisleIndex;
      }
      const isEvenAisle = a.aisleIndex % 2 === 0;
      return isEvenAisle ? b.rackPosition - a.rackPosition : a.rackPosition - b.rackPosition;
    });

    const aislesSet = new Set(sorted.map((i) => i.aisleIndex));
    const totalUnits = sorted.reduce((acc, i) => acc + i.quantity, 0);

    // Walking distance estimate: ~15 meters per aisle switch + ~2 meters per rack position
    const distanceMeters = Math.max(20, aislesSet.size * 15 + sorted.length * 4);
    // Estimated time: ~0.5 mins per pick item + ~1 min per 100 meters walked
    const durationMinutes = Math.round((sorted.length * 0.5 + distanceMeters / 100) * 10) / 10;

    return {
      waveId,
      totalPickItems: sorted.length,
      totalUnitsToPick: totalUnits,
      distinctAislesTraversed: aislesSet.size,
      estimatedWalkingDistanceMeters: distanceMeters,
      estimatedPickDurationMinutes: durationMinutes,
      orderedPickSequence: sorted,
      routingStrategy: 'S_SHAPE_HEURISTIC',
    };
  }
}
