/**
 * ShopSphere Database Layer - Deterministic Synthetic Domain Data Generator
 * Provides reproducible seed data using Linear Congruential PRNG:
 * - Realistic person names, emails, phone numbers
 * - Physical addresses with zip codes and GPS coordinates
 * - Product titles, SKUs, barcode numbers, pricing distributions
 */

export class FakerPRNGUtils {
  private seed: number;

  constructor(seed: number = 1337) {
    this.seed = seed;
  }

  public next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  public nextChoice<T>(items: T[]): T {
    return items[this.nextInt(0, items.length - 1)];
  }

  public nextEmail(firstName: string, lastName: string): string {
    const domain = this.nextChoice(['shopsphere.com', 'gmail.com', 'example.org', 'outlook.com']);
    const num = this.nextInt(10, 999);
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${num}@${domain}`;
  }

  public nextPhone(): string {
    const area = this.nextInt(200, 999);
    const mid = this.nextInt(100, 999);
    const last = this.nextInt(1000, 9999);
    return `+1-${area}-${mid}-${last}`;
  }

  public nextAddress(): { street: string; city: string; state: string; zip: string; lat: number; lng: number } {
    const streets = ['Market St', 'Broadway', 'Main Ave', 'Oakridge Lane', 'Pine Boulevard', 'Commerce Way'];
    const cities = [
      { city: 'San Francisco', state: 'CA', zip: '94103', lat: 37.7749, lng: -122.4194 },
      { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lng: -97.7431 },
      { city: 'New York', state: 'NY', zip: '10001', lat: 40.7128, lng: -74.006 },
      { city: 'Seattle', state: 'WA', zip: '98101', lat: 47.6062, lng: -122.3321 },
    ];
    const cityData = this.nextChoice(cities);
    const streetNum = this.nextInt(100, 9999);
    const streetName = this.nextChoice(streets);

    return {
      street: `${streetNum} ${streetName}`,
      city: cityData.city,
      state: cityData.state,
      zip: cityData.zip,
      lat: cityData.lat + (this.next() - 0.5) * 0.05,
      lng: cityData.lng + (this.next() - 0.5) * 0.05,
    };
  }

  public nextProduct(categoryName: string): { title: string; sku: string; price: number } {
    const adjectives = ['Ultra', 'Pro', 'Ergonomic', 'Wireless', 'Eco-Friendly', 'Smart', 'Precision', 'Compact'];
    const nouns = ['Headphones', 'Keyboard', 'Display', 'Backpack', 'Bottle', 'Sensor', 'Camera', 'Hub'];
    const adj = this.nextChoice(adjectives);
    const noun = this.nextChoice(nouns);
    const title = `${adj} ${categoryName} ${noun}`;
    const sku = `${categoryName.substring(0, 3).toUpperCase()}-${adj.substring(0, 3).toUpperCase()}-${this.nextInt(100, 999)}`;
    const price = Math.round((this.next() * 300 + 19.99) * 100) / 100;

    return { title, sku, price };
  }
}
