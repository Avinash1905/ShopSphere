export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeoSpatialDocument {
  id: string;
  title: string;
  location: GeoLocation;
  geohash: string;
  warehouseId?: string;
  serviceableRadiusKm: number;
  metadata?: Record<string, any>;
}

export interface GeoSearchResult {
  id: string;
  title: string;
  distanceKm: number;
  geoDecayScore: number; // 0.0 to 1.0 (1.0 = 0km, decaying with distance)
  location: GeoLocation;
  isWithinServiceArea: boolean;
  metadata?: Record<string, any>;
}

export class GeoSpatialSearchEngine {
  private documents: Map<string, GeoSpatialDocument> = new Map();
  private geohashIndex: Map<string, Set<string>> = new Map();

  private static readonly BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

  /**
   * Encodes latitude and longitude into standard geohash string
   */
  public static encodeGeohash(lat: number, lon: number, precision: number = 6): string {
    let latMin = -90.0, latMax = 90.0;
    let lonMin = -180.0, lonMax = 180.0;
    let hash = '';
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if (lon > mid) {
          ch |= 1 << (4 - bit);
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (lat > mid) {
          ch |= 1 << (4 - bit);
          latMin = mid;
        } else {
          latMax = mid;
        }
      }

      isEven = !isEven;
      if (bit < 4) {
        bit++;
      } else {
        hash += GeoSpatialSearchEngine.BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return hash;
  }

  /**
   * Calculates Haversine distance in kilometers between two geo points
   */
  public static calculateDistanceKm(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371;
    const dLat = (loc2.latitude - loc1.latitude) * (Math.PI / 180);
    const dLon = (loc2.longitude - loc1.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.latitude * (Math.PI / 180)) * Math.cos(loc2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Indexes a document with geo coordinates
   */
  public index(doc: Omit<GeoSpatialDocument, 'geohash'>): void {
    const geohash = GeoSpatialSearchEngine.encodeGeohash(doc.location.latitude, doc.location.longitude);
    const fullDoc: GeoSpatialDocument = { ...doc, geohash };
    this.documents.set(doc.id, fullDoc);

    // Index prefixes (precision 2 to 6)
    for (let p = 2; p <= geohash.length; p++) {
      const prefix = geohash.substring(0, p);
      if (!this.geohashIndex.has(prefix)) {
        this.geohashIndex.set(prefix, new Set());
      }
      this.geohashIndex.get(prefix)!.add(doc.id);
    }
  }

  /**
   * Searches for documents within radiusKm of center coordinate with Gaussian proximity decay scoring
   */
  public searchRadius(
    center: GeoLocation,
    radiusKm: number = 50,
    halfLifeDecayKm: number = 25
  ): GeoSearchResult[] {
    const results: GeoSearchResult[] = [];

    for (const doc of this.documents.values()) {
      const distance = GeoSpatialSearchEngine.calculateDistanceKm(center, doc.location);
      if (distance <= radiusKm) {
        // Gaussian score decay: exp( -0.5 * (distance / halfLife)^2 )
        const decayScore = Math.exp(-0.5 * Math.pow(distance / halfLifeDecayKm, 2));
        const withinService = distance <= doc.serviceableRadiusKm;

        results.push({
          id: doc.id,
          title: doc.title,
          distanceKm: distance,
          geoDecayScore: Math.round(decayScore * 1000) / 1000,
          location: doc.location,
          isWithinServiceArea: withinService,
          metadata: doc.metadata,
        });
      }
    }

    // Sort by closest distance
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return results;
  }

  public size(): number {
    return this.documents.size;
  }

  public clear(): void {
    this.documents.clear();
    this.geohashIndex.clear();
  }
}
